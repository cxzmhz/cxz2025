// @ts-nocheck
import { createElement, useEffect, useRef } from 'rax';
import View from 'rax-view';
import CryptoJS from 'crypto-js';
import { fetchBTDoorInfos } from '@/api/visitor';
import styles from './index.module.scss';
import confirm from '@uni/confirm';
import { debounce } from '@/utils/utils';
import { reportOpenDoorResult } from '@/api/visitor';

enum DeviceStatusType {
  NORMAL = 0, // 正常
  OUTLINE = 1, // 离线
  UNAUTY = 2, // 未授权
}

interface GetBTDoorInfosResData {
  communityId?: string; // 项目id
  deviceId?: string; // 设备id（对应后台的基础设备里门禁设备id），开门和上报的时候使用
  deviceName?: string; // 设备名称（有简称使用简称，无简称使用设备名称），业务展示的时候使用
  deviceType?: number; // 设备类型：1:远程门禁，2:科拓蓝牙门禁，远程+蓝牙=3
  deviceStatus?: number; // 设备状态：0正常，1离线，2未授权
  deviceAddress: string; // 设备的实际名称（科拓蓝牙设备是KTOP5开头，标准蓝牙门禁是MIXC开头）（蓝牙设备才有的属性）
  deviceCode?: string; // 设备编码，科拓蓝牙=设备id+设备编号（蓝牙设备才有的属性）9位编码，标准蓝牙门禁是9位数字，蓝牙通信的时候使用
  bluetoothKey?: string; // 蓝牙门禁密钥，蓝牙门禁才需要（蓝牙设备才有的属性）
}

interface IProps {
  visitorRecordId: string;
  refreshDetail: () => void; // 更新详情数据
}

type ModeType = 'central' | 'peripheral';

const KTOPsecretKey = 'keytop0123456789'; // TODO 科拓默认加密秘钥，没有改变的话默认是这个

const RSSI_FILTER_VALUE = -85; // 蓝牙信号过滤值，信号比这差（信号值小于这个）的都不处理

// 处理设备的名称，判断是否是蓝牙设备，科拓蓝牙设备，标准蓝牙设备
const handleDeviceName = (deviceName: string) => {
  // 现在不做大写化处理，不匹配就是不匹配
  // const capitalName = deviceName ? deviceName.toLocaleUpperCase() : '';
  let isBTH = false,
    isKTOP5 = false,
    isCOM = false;
  if (
    deviceName &&
    (deviceName.startsWith('KTOP5') || deviceName.startsWith('MIXC'))
  ) {
    isBTH = true;
    if (deviceName.startsWith('KTOP5')) {
      isKTOP5 = true;
    }
    if (deviceName.startsWith('MIXC')) {
      isCOM = true;
    }
  }
  return { isBTH, isKTOP5, isCOM };
};

// 使用AES加密数据，加密的结果就是base64格式
const encrypt = (plaintText: string, KEY: string) => {
  if (!plaintText || !KEY) return;
  const options = {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  };
  try {
    const key = CryptoJS.enc.Utf8.parse(KEY);
    const encryptedData = CryptoJS.AES.encrypt(plaintText, key, options);
    console.log('.....encryptedData数据加密结果', encryptedData.toString());
    return encryptedData.toString();
  } catch (err) {
    // 加密失败
    return false;
  }
};

/**
 * 将数据转换为ArrayBuffer
 * @param {*} writeData 需要转换的数据
 */
const transferWriteData = (writeData: any) => {
  let buffer = new ArrayBuffer(writeData.length);
  let dataView = new DataView(buffer);
  for (let i = 0; i < writeData.length; i++) {
    console.log('.....0x' + writeData[i]);
    dataView.setUint8(i, ('0x' + writeData[i]) as any);
  }
  return buffer;
};

/**
 * @desc ArrayBuffer转16进度字符串
 */
const ab2hex = (buffer: any) => {
  var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
    return ('00' + bit.toString(16)).slice(-2);
  });
  return hexArr.join('');
};

/**
 * @desc 16进制转为字符串
 */
const hexToStr = (hexContent: any) => {
  let c = '';
  let result = '';
  for (let i = 0; i < hexContent.length; i++) {
    c += hexContent[i];
    if ((i + 1) % 2 == 0) {
      result += String.fromCharCode(parseInt(c, 16));
      c = '';
    }
  }
  return result;
};

// 生成18位的随机数
const generateRandom = pre => {
  return `${pre}${Math.floor((Math.random() + 1) * 10000)}`;
};

// 特征值写入响应码
const RespondCodeMap: Record<string, any> = {
  'cmd:0': '开门失败',
  'cmd:1': '开门成功',
  'cmd:2': '未知命令或无效命令码',
  'cmd:3': '分割命令字符串错误',
  'cmd:4': '解密错误',
};

export default function BluetoothOpenDoor({
  visitorRecordId,
  refreshDetail,
}: IProps) {
  const system = useRef<'ios' | 'android'>('ios');
  const discovering = useRef<boolean>(false); // 是否是搜索状态
  const available = useRef<boolean>(false); // 当前手机的蓝牙是否可用
  const blueDevices = useRef<Record<string, any>>({}); // 当前搜索到的蓝牙门禁列表，只有大于-85的才会被添加进来
  const blueDevicesCache = useRef<Record<string, any>>({}); // 当前搜索到的所有蓝牙门禁，不分信号强度
  const userBTDataCache = useRef<GetBTDoorInfosResData[]>([]); // 所访问的业主的有权限的蓝牙门禁数据完整数据
  const userBTDataMap = useRef<Record<string, GetBTDoorInfosResData>>({}); // 所访问的业主的有权限的蓝牙门禁数据的map
  // 当前业主的蓝牙门禁数据状态；isEmpty 代表是否返回的门禁列表为空，isAllDisabled 代表是否所有返回的门禁都不可用；这2种情况下点击开门都是直接toast提示，不做进一步操作
  const curBTDataStatesRef = useRef<{
    isEmpty: boolean;
    isAllDisabled: boolean;
  }>({
    isEmpty: false,
    isAllDisabled: false,
  });
  const isOpening = useRef<boolean>(false); // 当前是否在开门中（是否启动了开门逻辑，同时也表示当前还没有门禁开门成功或失败过，如果有这个时候有门禁执行完开门程序，则需要提示），（如果是在开门中，且还在搜索设备，则搜索到的设备都要执行开门程序）
  // const finishToastFlag = useRef<boolean>(false); // 开门结束的提示标识，如果为true，表示此次多开门已经有一个门开门结束且提示过，其他的门不管失败或成功都不再提示了
  const hasInitBTAdapter = useRef<boolean>(false); // 是否已初始化好蓝牙适配器（如果已经初始化了，就可以直接执行搜索程序）

  // 多开门蓝牙设备搜索的逻辑：
  // 1. 打开通行条或邀请函页面的时候，先初始化蓝牙设备，并开启蓝牙设备搜索程序，定时5秒，并将这5秒内搜索到的数据暂存下来，
  // 2. 在搜索程序执行完毕后再设置一个10秒的定时器，10秒之后将之前搜索到的设备数据清除，
  // 3. 用户点击一键开门按钮的时候，查看当前有没有已经存储的设备信息，如果有就直接使用，
  // 4. 如果没有开启蓝牙设备搜索程序，定时5秒，并将这5秒内搜索到的数据暂存下来，同时使用当前搜索到的设备数据执行开门程序，
  // 5. 5秒后停止搜索程序，同时执行一个10秒的定时器，10秒之后将之前搜索到的设备数据清除，
  // 6. 如果点击一键开门按钮的时候，当前有没有已经存储的设备信息，执行了搜索蓝牙设备的程序，那么搜索到第一个蓝牙设备就直接执行开门程序
  // 7. 在开第一个门的过程中如果搜索到了第二个门，就接着执行开门程序，第三个门也一样，只要第一个门还在开门过程中，就接着执行
  // 8. 如果第一个门开门结束了（不管开门成功还是失败），后面搜索到的门就都不开了；
  // 9. 所有的上报和提示都是以第一个为准
  // 之后的开门逻辑循环执行上面第3点到第9点
  const searchTimer = useRef<any>(null); // 搜索的定时器
  const deleteBTDataTimer = useRef<any>(null); // 清除搜索到的蓝牙设备信息的定时器
  const openDoorTimer = useRef<any>(null); // 开门的定时器，超过5s就不开了

  const openTime = useRef<number>(0);
  const curRecordId = useRef<string>('');
  const openingNameMap = useRef<Record<string, true>>({}); // 正在开门的门禁名称的map
  const reportedNameMap = useRef<Record<string, true>>({}); // 已上报的门禁的map

  // 上报数据
  const handleReport = ({ curUserData, openResult }) => {
    if (reportedNameMap.current[curUserData.deviceAddress]) return;
    reportedNameMap.current[curUserData.deviceAddress] = true;
    const params = {
      visitorRecordId,
      consumeOpenTimes: 0,
      detail: {
        deviceId: [401, 402].includes(openResult) ? null : curUserData.deviceId,
        openResult,
        remark: '',
        duration: Date.now() - openTime.current,
        communityId: curUserData.communityId,
        batchOpen: 1,
        recordId: curRecordId.current,
        openTimeUnix: openTime.current,
      },
    };
    reportOpenDoorResult(params);
  };

  /**
   * 关闭蓝牙适配器
   */
  const closeBluetoothAdapter = () => {
    hasInitBTAdapter.current = false;
    wx.closeBluetoothAdapter();
  };
  /**
   * 停止搜索蓝牙设备
   */
  const stopBluetoothDevicesDiscovery = () => {
    wx.stopBluetoothDevicesDiscovery({
      success(res) {
        console.log('.....停止搜索设备成功：' + JSON.stringify(res));
      },
      fail(res) {
        console.log('.....停止搜索设备失败' + JSON.stringify(res));
      },
    });
  };
  /**
   * 取消监听蓝牙搜索结果
   */
  const offBluetoothDeviceFound = () => {
    wx.offBluetoothDeviceFound &&
      wx.offBluetoothDeviceFound({
        success(res: any) {
          console.log('.....取消监听蓝牙搜索结果' + JSON.stringify(res));
        },
        fail(res: any) {
          console.log('.....取消监听蓝牙搜索结果' + JSON.stringify(res));
        },
      } as any);
  };

  // 搜索到蓝牙门禁后的处理逻辑
  const handleBlueToothFound = res => {
    const devices = res.devices;
    // 过滤只有信号在 -85dBm 以上且是科拓蓝牙门禁的设备才处理
    devices.forEach((de: any) => {
      const { name: deviceName } = de;
      const { isBTH } = handleDeviceName(deviceName);
      // const capitalName = deviceName ? deviceName.toLocaleUpperCase() : '';
      if (isBTH) {
        blueDevicesCache.current[deviceName] = de;
        console.log('.....发现新设备', de);
      }
      if (de.RSSI >= RSSI_FILTER_VALUE) {
        if (isBTH) {
          blueDevices.current[deviceName] = de;
          if (isOpening.current) {
            const matchDevice = userBTDataMap.current[deviceName];
            if (!!matchDevice) {
              handleOpenDoor(matchDevice, de);
            }
          }
        }
      }
    });
  };
  /**
   * 监听蓝牙搜索结果
   * 监听搜索到新设备的事件
   */
  const bluetoothDeviceFound = () => {
    console.log('.....bluetoothDeviceFound');
    wx.onBluetoothDeviceFound(function (res) {
      handleBlueToothFound(res);
    });
  };
  // 查找已经存在的设备（安卓多次连接会导致搜索不到）
  const findExistList = () => {
    wx.getBluetoothDevices({
      success(res) {
        console.log('.....findExistList', res);
        handleBlueToothFound(res);
      },
      complete(res) {
        bluetoothDeviceFound();
      },
    });
  };

  // 设置10秒定时器删除上次搜索到的蓝牙设备信息
  const handleDeleteBTData = () => {
    deleteBTDataTimer.current = setTimeout(() => {
      blueDevices.current = {};
      clearTimeout(deleteBTDataTimer.current);
      deleteBTDataTimer.current = null;
    }, 10000);
  };

  // 重置删除蓝牙设备信息的定时器
  const resetDeleteBTDataTimer = () => {
    clearTimeout(deleteBTDataTimer.current);
    deleteBTDataTimer.current = null;
    handleDeleteBTData();
  };

  // 蓝牙设备搜索结束后的结果上报
  const handleFinishFoundReport = () => {
    const isNotFound = JSON.stringify(blueDevices.current) === '{}';
    const isNoneMatched = !Object.values(userBTDataMap.current).some(ub => {
      return !!blueDevices.current[ub.deviceAddress];
    });
    userBTDataCache.current.some(ub => {
      const matchBTData = blueDevicesCache.current[ub.deviceAddress];
      // 如果搜索到的设备列表为空，则上报401，且只上报一次
      if (isNotFound) {
        handleReport({ curUserData: ub, openResult: 401 });
        return true;
      } else if (isNoneMatched) {
        // 如果所有蓝牙设备没有匹配上的，则上报402，且只上报一次
        handleReport({ curUserData: ub, openResult: 402 });
        return true;
      } else if (matchBTData.RSSI < RSSI_FILTER_VALUE) {
        handleReport({ curUserData: ub, openResult: 403 });
      }
      return false;
    });
  };

  // 结束搜索
  const handleFinishSearch = () => {
    if (isOpening.current) {
      if (JSON.stringify(blueDevices.current) === '{}') {
        handleFinishOpenDoor();
        wx.showToast({
          title: '信号弱，或附近无门禁，请靠近重试',
          icon: 'none',
        });
      } else {
        const matchRes = Object.values(userBTDataMap.current).some(ub => {
          return !!blueDevices.current[ub.deviceAddress];
        });
        // 已搜索到的蓝牙设备没有匹配上的
        if (!matchRes) {
          handleFinishOpenDoor();
          wx.showToast({
            title: '门禁未授权，或配置错误，请联系管家',
            icon: 'none',
          });
          blueDevices.current = {};
        } else {
          resetDeleteBTDataTimer();
        }
      }
    } else {
      resetDeleteBTDataTimer();
    }
  };

  /**
   * 开始搜索附近的蓝牙设备
   * 此操作比较耗费系统资源，搜索到需要的设备后需要及时调用 wx.stopBluetoothDevicesDiscovery 停止搜索。
   */
  const startBluetoothDevicesDiscovery = () => {
    wx.startBluetoothDevicesDiscovery({
      success(res) {
        console.log('.....开始搜索蓝牙设备' + JSON.stringify(res));
        // 监听蓝牙搜索
        findExistList();
        // 5秒停止搜索
        searchTimer.current = setTimeout(() => {
          stopDevice();
          clearTimeout(searchTimer.current);
          searchTimer.current = null;
          handleFinishSearch();
          handleFinishFoundReport();
        }, 5000);
      },
      fail(res) {
        console.log('.....开始搜索蓝牙设备失败' + JSON.stringify(res));
      },
    });
  };

  // 蓝牙适配器可能已经初始化成功，但是蓝牙未开启，这个时候可以监听蓝牙适配器状态变更，但我们在调用初始化蓝牙适配器之前就先查看了系统蓝牙的开启状态了，所以不需要调用这个api
  const watchAdapterStateChange = () => {
    wx.onBluetoothAdapterStateChange(res => {
      // 搜索状态
      if (discovering.current !== res.discovering) {
        discovering.current = res.discovering;
        wx.offBluetoothAdapterStateChange();
        startBluetoothDevicesDiscovery();
      }
      // 蓝牙状态
      if (available.current !== res.available) {
        available.current = res.available;
        // 如果手机的蓝牙不可用
        console.log('.....蓝牙不可用' + JSON.stringify(res));
        if (!res.available) {
          wx.showToast({
            title: '蓝牙未开启',
            icon: 'none',
          });
        } else {
          if (!res.discovering) {
            wx.offBluetoothAdapterStateChange();
            startBluetoothDevicesDiscovery();
          }
        }
      }
    });
  };
  /**
   * 初始化蓝牙模块。iOS 上开启主机/从机（外围设备）模式时需分别调用一次，并指定对应的 mode。
   */
  const openBluetooth = (curMode: ModeType) => {
    const mode = curMode || 'central';
    // TODO: 根据实际调试结果确定是否需要先调用wx.closeBluetoothAdapter执行一次以释放蓝牙资源
    wx.openBluetoothAdapter({
      mode,
      success(res) {
        console.log('.....蓝牙初始化成功：' + JSON.stringify(res));
        if (mode === 'central' && system.current === 'ios') {
          openBluetooth('peripheral');
        } else {
          !isOpening.current && wx.hideLoading();
          hasInitBTAdapter.current = true;
          startBluetoothDevicesDiscovery();
        }
      },
      fail(res) {
        handleFinishOpenDoor();
        console.log('.....蓝牙初始化失败：' + JSON.stringify(res));
        let content = '初始化蓝牙适配器失败';
        if (res.errMsg.indexOf('openBluetoothAdapter:fail auth deny') > -1) {
          content = '微信蓝牙权限未启用';
        } else if (res.errCode === 10001) {
          content = '蓝牙未开启';
        } else {
          content = '初始化蓝牙适配器失败';
        }
        console.log('.....蓝牙初始化失败信息', content);
        // 如果初始化蓝牙适配器失败，就调用wx.closeBluetoothAdapter执行一次以释放蓝牙资源
        closeBluetoothAdapter();
        handleSystemInfo();
        // wx.showToast({
        //   title: content,
        //   icon: 'none',
        //   duration: 2000,
        // });
        // watchAdapterStateChange();
      },
    });
  };

  const goOpenSetting = (content: string) => {
    confirm({
      content: content,
      confirmText: '确定',
      confirmColor: '#FFAF48',
      success: clickRes => {
        if (clickRes?.confirm) {
          wx.openSetting({
            success: () => {},
          });
        }
      },
    });
  };

  // 处理小程序权限
  const handleMiniAuth = () => {
    wx.getSetting({
      success: setRes => {
        const allAuthSetting = setRes.authSetting || {};
        console.log('.....allAuthSetting小程序获取的权限', allAuthSetting);
        const bluetoothAuth = allAuthSetting['scope.bluetooth'];
        const locationAuth = allAuthSetting['scope.userLocation'];
        console.log(
          '.....bluetoothAuth,locationAuth',
          bluetoothAuth,
          locationAuth
        );
        if (
          bluetoothAuth &&
          (system.current === 'ios' ||
            (system.current === 'android' && locationAuth))
        ) {
          openBluetooth('central');
        } else {
          handleFinishOpenDoor();
          // 之前没有申请过该权限
          if (bluetoothAuth === undefined || bluetoothAuth === null) {
            wx.authorize({
              scope: 'scope.bluetooth',
              success: function (res) {
                console.log('.....scope.bluetooth', res);
              },
              fail: function (err) {
                console.log('.....申请蓝牙权限失败', err);
                goOpenSetting('请先开启小程序蓝牙权限');
              },
            });
            return;
          }
          if (bluetoothAuth === false) {
            goOpenSetting('请先开启小程序蓝牙权限');
            return;
          }
          if (system.current === 'android') {
            // 之前没有申请过该权限
            if (locationAuth === undefined || locationAuth === null) {
              wx.authorize({
                scope: 'scope.userLocation',
                success: function (res) {
                  console.log('.....scope.userLocation', res);
                },
                fail: function (err) {
                  goOpenSetting('请先开启小程序定位服务');
                },
              });
              return;
            }
            if (locationAuth === false) {
              goOpenSetting('请先开启小程序定位服务');
              return;
            }
          }
        }
      },
    });
  };

  const handleSystemInfo = () => {
    wx.getSystemInfo({
      success: function (res) {
        // bluetoothEnabled: 蓝牙是否开启； locationEnabled： 定位是否开启； locationAuthorized： 允许微信使用定位的开关
        const { bluetoothEnabled, locationEnabled, locationAuthorized } = res;
        console.log('.....getSystemInfo', res);
        // 没打开蓝牙或微信无蓝牙权限
        if (!bluetoothEnabled) {
          confirm({
            content: '请先开启蓝牙',
            confirmText: '确定',
            confirmColor: '#FFAF48',
            success: clickRes => {
              if (clickRes?.confirm) {
                wx.openAppAuthorizeSetting({
                  success(res) {
                    console.log('.....打开小程序系统授权设置页', res);
                  },
                });
              }
            },
          });
          handleFinishOpenDoor();
          return;
        }
        if (res.system.indexOf('iOS') > -1) {
          system.current = 'ios';
        } else if (res.system.indexOf('Android') > -1) {
          system.current = 'android';
          // 手机没打开定位
          if (!locationEnabled) {
            confirm({
              content: '请先开启定位服务',
              confirmText: '知道了',
              confirmColor: '#FFAF48',
              showCancel: false,
            });
            handleFinishOpenDoor();
            return;
          }
          // 微信无定位权限
          if (!locationAuthorized) {
            confirm({
              content: '请先开启定位服务',
              confirmText: '确定',
              confirmColor: '#FFAF48',
              success: clickRes => {
                if (clickRes?.confirm) {
                  wx.openAppAuthorizeSetting({
                    success(res) {
                      console.log('.....打开小程序系统授权设置页', res);
                    },
                  });
                }
              },
            });
            handleFinishOpenDoor();
            return;
          }
        } else {
          console.log('.....没有检测到对应的系统');
        }
        handleMiniAuth();
      },
    });
  };
  /**
   * 初始化蓝牙适配器
   * iOS只需打开蓝牙即可开始扫描蓝牙；Android从安卓6版本开始需要打开蓝牙及位置信息才可以开始扫描蓝牙。
   */
  const init = () => {
    // 如果当前已经初始化过适配器，则直接开始搜索蓝牙
    if (hasInitBTAdapter.current) {
      startBluetoothDevicesDiscovery();
      return;
    }
    wx.showLoading();
    handleSystemInfo();
  };

  /**
   * 断开连接蓝牙低功耗设备
   */
  const closeBLEConnection = (deviceId: any, callback?: Function) => {
    console.log('.....deviceId', deviceId);
    wx.closeBLEConnection({
      deviceId,
      success(res) {
        console.log('.....断开连接蓝牙低功耗设备成功' + JSON.stringify(res));
        setTimeout(() => {
          callback && callback();
        }, 300);
      },
      fail(res) {
        console.log('.....断开连接蓝牙低功耗设备失败' + JSON.stringify(res));
        setTimeout(() => {
          callback && callback();
        }, 300);
      },
    });
  };

  /**
   * @desc 监听蓝牙低功耗设备的特征值变化事件
   */
  const onBLECharacteristicValueChange = (
    deviceId: any,
    curUserData: GetBTDoorInfosResData
  ) => {
    wx.onBLECharacteristicValueChange(function (res) {
      console.log('.....特征值变化', JSON.parse(JSON.stringify(res)));
      const hexContent = ab2hex(res.value);
      console.log('.....hexContent', hexContent);

      const openRes = hexToStr(hexContent)?.trim();
      console.log('.....openRes', openRes);

      const { deviceAddress } = curUserData;

      const { isKTOP5, isCOM } = handleDeviceName(deviceAddress);
      let reportCode = 100;
      let errorTxt = '开门失败';
      if (isKTOP5) {
        // 上报数据
        switch (openRes) {
          case 'cmd:0':
            reportCode = 60007;
            errorTxt = '开门失败，编码错误，请重试';
            break;
          case 'cmd:1':
            reportCode = 100;
            break;
          case 'cmd:2':
          case 'cmd:3':
          case 'cmd:4':
            reportCode = 60007;
            break;
        }
      } else {
        errorTxt = '连接失败，请重试';
        if (openRes === '2') {
          // 编码错误
          errorTxt = '开门失败，编码错误，请重试';
        }
        if (openRes === '0') {
          reportCode = 100;
        } else {
          reportCode = isNaN(Number(openRes)) ? -1 : Number(openRes);
        }
      }
      const params = {
        visitorRecordId,
        consumeOpenTimes: 0,
        detail: {
          deviceId: curUserData.deviceId,
          openResult: reportCode,
          remark: '',
          duration: Date.now() - openTime.current,
          communityId: curUserData.communityId,
          batchOpen: 1,
          recordId: curRecordId.current,
          openTimeUnix: openTime.current,
        },
      };

      const isOpenSuc =
        (isKTOP5 && openRes === 'cmd:1') || (isCOM && openRes === '0');
      if (isOpening.current) {
        // 开门结果提示，如果没有提示过，就说明是第一个结束的，需要提示
        handleFinishOpenDoor();
        if (isOpenSuc) {
          wx.showToast({
            title: `开门成功\n${curUserData.deviceName}`,
            icon: 'none',
            duration: 2000,
          });
          params.consumeOpenTimes = 1;
        } else {
          wx.showToast({
            title: errorTxt,
            icon: 'none',
            duration: 2000,
          });
        }
      }

      if (reportedNameMap.current[curUserData.deviceAddress]) return;
      reportedNameMap.current[curUserData.deviceAddress] = true;

      reportOpenDoorResult(params).then(() => {
        if (isOpenSuc) {
          refreshDetail(); // 开门成功且上报成功才更新页面数据
        }
      });
    });
  };
  /**
   * @desc 启用蓝牙低功耗设备特征值变化时的 notify 功能
   */
  const notifyBLECharacteristicValueChange = (connectDevice: any) => {
    const deviceId = connectDevice.deviceId;
    const serviceId = connectDevice.notifyService.uuid;
    const characteristicId = connectDevice.notifyCharacteristic.uuid; // TODO 如果这里不行，可以尝试将uuid全部转换为大写，因为小写ios可能无法识别
    const curUserData = connectDevice.curUserData;
    console.log('.....notify', connectDevice);
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId,
      // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
      serviceId,
      // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
      characteristicId,
      success(res) {
        console.log(
          '.....notifyBLECharacteristicValueChange success',
          res.errMsg
        );
        onBLECharacteristicValueChange(deviceId, curUserData);
      },
      fail(res) {
        console.log('.....notifyBLECharacteristicValueChange 失败', res);
      },
      complete(res) {
        console.log('.....notifyBLECharacteristicValueChange complete', res);
      },
    });
  };

  /**
   * @desc 特征值写入
   */
  const runWrite = (
    connectDevice: any,
    buffer: any,
    length: any,
    index: any
  ) => {
    const deviceId = connectDevice.deviceId;
    const serviceId = connectDevice.writeService.uuid.toUpperCase();
    const characteristicId =
      connectDevice.writeCharacteristic.uuid.toUpperCase();

    console.log('.....runWrite ', connectDevice);

    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId,
      // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
      serviceId,
      // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
      characteristicId,
      // 这里的value是ArrayBuffer类型
      value: buffer,
      success(res) {
        console.log(
          `.....${connectDevice.curUserData.deviceAddress}的第${
            index + 1
          }个写入成功：${JSON.stringify(res)}`
        );
      },
      fail(res) {
        console.log('.....runWrite失败', res);
        handleFinishOpenDoor();
        wx.showToast({
          title: '开门失败',
          icon: 'none',
          duration: 2000,
        });
        console.log(
          `.....${connectDevice.curUserData.deviceAddress}的第${
            index + 1
          }个写入失败：${JSON.stringify(res)}`
        );
        handleReport({
          curUserData: connectDevice.curUserData,
          openResult: 60006,
        });
        closeBLEConnection(deviceId);
      },
    });
  };

  /**
   * @desc 获取特征值
   * @writeBuffers 要写入蓝牙设备的数据
   */
  const getBLEDeviceCharacteristics = (
    connectDevice: any,
    deviceId: any,
    writeBuffers: any,
    services: any,
    index: any
  ) => {
    console.log('.....services', services);

    const service = services[index];
    const serviceId = service.uuid.toUpperCase();
    // 获取蓝牙低功耗设备某个服务中所有特征，比如写，如果有这个特征值，说明此设备支持写入操作
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 wx.createBLEConnection 与对应设备建立链接
      deviceId,
      // 这里的 serviceId 需要在 wx.getBLEDeviceServices 接口中获取
      serviceId,
      success(res) {
        console.log('.....getBLEDeviceCharacteristics success', res);

        const characteristics = res.characteristics;
        for (let i = 0; i < characteristics.length; i++) {
          const characteristic = characteristics[i];
          if (characteristic?.properties?.notify) {
            // 通知特征值
            console.log('.....成功获取通知特征值：', connectDevice);
            connectDevice.notifyService = service;
            connectDevice.notifyCharacteristic = characteristic;
          }
          if (characteristic?.properties?.write) {
            // 获取写特征值
            console.log('.....成功获取写特征值：', connectDevice);
            connectDevice.writeService = service;
            connectDevice.writeCharacteristic = characteristic;
          }
          if (
            connectDevice.notifyService != null &&
            connectDevice.notifyCharacteristic != null &&
            connectDevice.writeService != null &&
            connectDevice.writeCharacteristic != null
          ) {
            console.log('.....获取特征值完毕', connectDevice);
            notifyBLECharacteristicValueChange(connectDevice);
            for (let j = 0; j < writeBuffers.length; j++) {
              runWrite(connectDevice, writeBuffers[j], writeBuffers.length, j);
            }
            return;
          }
        }
        console.log('.....继续获取write特征值');
        index++;
        if (index < services.length) {
          getBLEDeviceCharacteristics(
            connectDevice,
            deviceId,
            writeBuffers,
            services,
            index
          );
        }
      },
      fail(res: any) {
        console.log('.....获取特征值失败:', res.services);
        index++;
        if (index < services.length) {
          getBLEDeviceCharacteristics(
            connectDevice,
            deviceId,
            writeBuffers,
            services,
            index
          );
        } else {
          handleReport({
            curUserData: connectDevice.curUserData,
            openResult: 60010,
          });
          handleFinishOpenDoor();
          if (isOpening.current) {
            wx.showToast({
              title: '当前蓝牙信号弱或被占用',
              icon: 'none',
            });
            isOpening.current = false;
          }
        }
      },
    });
  };

  /**
   * @desc 开门-连接蓝牙设备
   * @writeBuffers 需要发送给蓝牙设备的ArrayBuffer数据
   */
  const runOpenDoor = (
    deviceId: any,
    curUserData: GetBTDoorInfosResData,
    writeBuffers: any
  ) => {
    wx.createBLEConnection({
      deviceId,
      success(res) {
        console.log('.....连接蓝牙低功耗设备成功' + JSON.stringify(res));
        const connectDevice = {
          curUserData,
          deviceId: deviceId,
          writeService: null,
          writeCharacteristic: null, // 写入的特征值
          notifyService: null,
          notifyCharacteristic: null, // 通知的特征值
        };
        // 获取当前deviceId对应设备的所有服务
        wx.getBLEDeviceServices({
          // 这里的 deviceId 已经通过 wx.createBLEConnection 与对应设备建立连接
          deviceId,
          success(res) {
            console.log('.....获取服务成功:', res.services);
            const services = res.services;
            // 获取特征值
            getBLEDeviceCharacteristics(
              connectDevice,
              deviceId,
              writeBuffers,
              services,
              0
            );
          },
          fail(res: any) {
            handleFinishOpenDoor();
            console.log('.....获取服务失败:', res.services);
            if (isOpening.current) {
              wx.showToast({
                title: '当前蓝牙信号弱或被占用',
                icon: 'none',
              });
              isOpening.current = false;
            }
            handleReport({ curUserData, openResult: 60010 });
          },
        });
      },
      fail(res) {
        handleFinishOpenDoor();
        console.log('.....连接蓝牙低功耗设备失败' + JSON.stringify(res));
        if (isOpening.current) {
          wx.showToast({
            title: '当前蓝牙信号弱或被占用',
            icon: 'none',
          });
          isOpening.current = false;
        }
        handleReport({ curUserData, openResult: 60004 });
      },
    });
  };

  /**
   * 组装开门数据
   * @param content 加密后的信息
   */
  const assembleOpenData = (
    deviceId: string,
    curUserData: GetBTDoorInfosResData,
    content: string
  ) => {
    console.log(
      '.....assembleOpenData当前要组装的开门数据',
      deviceId,
      curUserData,
      content
    );
    const { deviceAddress } = curUserData;
    const writeData: string[] = [];
    const { isKTOP5 } = handleDeviceName(deviceAddress);
    if (isKTOP5) {
      // 科拓的蓝牙门禁加密转换出来的数据前面还要加上开门命令 cmd-open: 所转换出来的16进制ASCII码，即：636D642D6F70656E3A
      writeData.push(...['63', '6D', '64', '2D', '6F', '70', '65', '6E', '3A']);
    } else {
      // 标准蓝牙门禁的前面加命令 open:
      content = 'open:' + content;
    }
    // 将命令转换成16进制
    for (let i = 0; i < content.length; i++) {
      const d = content.charAt(i);
      let dHex = d.charCodeAt(0).toString(16);
      if (dHex.length == 1) {
        dHex = '0' + dHex;
      }
      writeData.push(dHex);
    }
    // 数据要以 0D 作为结束标识，0D其实就是换行符
    writeData.push('0D');

    console.log('.....需要发送的16进制数据：' + writeData.join(''));

    const writeBuffers: any[] = [];
    // 目前使用的都是蓝牙5.0协议，每次只能发送128字节
    let writeItem: string[] = [];
    let num = 0;
    for (let i = 0; i < writeData.length; i++) {
      const item = writeData[i];
      num++;
      writeItem.push(item);
      if (num === 128) {
        // 小程序蓝牙传输的时候需要转换成ArrayBuffer
        writeBuffers.push(transferWriteData(writeItem));
        writeItem = [];
        num = 0;
      }
    }
    if (writeItem.length > 0) {
      writeBuffers.push(transferWriteData(writeItem));
    }
    // 写入数据
    runOpenDoor(deviceId, curUserData, writeBuffers);
  };

  // 开门操作
  const handleOpenDoor = (curUserData, matchBTData) => {
    console.log('.....当前处理的蓝牙设备后台返回的数据', curUserData);
    console.log('.....当前匹配到的蓝牙门禁设备', matchBTData);
    const { name: deviceName, deviceId } = matchBTData;
    if (openingNameMap.current[deviceName]) return;
    openingNameMap.current[deviceName] = true;

    console.log(`.....当前蓝牙门禁的设备id：${deviceId};`);

    const { deviceCode } = curUserData;
    const { isKTOP5 } = handleDeviceName(deviceName);
    let sentData = '';
    // 科拓蓝牙门禁
    if (isKTOP5) {
      const communityCode = deviceCode.substr(0, 6);
      const deviceNums = deviceCode.substr(6);
      sentData = `;;${communityCode};${deviceNums};`;
    } else {
      // 标准蓝牙门禁
      sentData = deviceCode;
    }
    let encryptKey = isKTOP5
      ? curUserData.bluetoothKey || KTOPsecretKey
      : curUserData.bluetoothKey;
    // 数据加密
    const encryptRes = encrypt(sentData, encryptKey);
    if (!encryptRes) {
      handleFinishOpenDoor();
      wx.showToast({
        title: '开门失败，请重试',
        icon: 'none',
        duration: 2000,
      });
      handleReport({ curUserData, openResult: 60007 });
      return;
    }
    // 组装开门数据
    assembleOpenData(deviceId, curUserData, encryptRes);
  };

  const stopDevice = () => {
    stopBluetoothDevicesDiscovery();
    offBluetoothDeviceFound();
  };

  const initBTData = async (visitorRecordId: string) => {
    try {
      const res = await fetchBTDoorInfos({ visitorRecordId });
      if (res.code === 200) {
        const dataTmp = res.data;
        if (!dataTmp?.length) {
          curBTDataStatesRef.current = {
            ...curBTDataStatesRef.current,
            isEmpty: true,
          };
          return;
        }
        const normalList = dataTmp.filter(
          item => item.deviceStatus !== DeviceStatusType.UNAUTY
        );
        if (!normalList?.length) {
          curBTDataStatesRef.current = {
            ...curBTDataStatesRef.current,
            isAllDisabled: true,
          };
          return;
        }
        userBTDataCache.current = dataTmp;
        normalList.forEach(nl => {
          userBTDataMap.current[nl.deviceAddress] = nl;
        });
        const canOpenDoor = handleCanOpenDoor(false);
        if (canOpenDoor) {
          init();
        }
      }
    } catch (err) {
      console.error(err);
      wx.showToast({
        title: '获取门禁信息失败，请重试',
        icon: 'none',
      });
    }
  };

  useEffect(() => {
    if (visitorRecordId) {
      // 获取用户的蓝牙门禁数据
      initBTData(visitorRecordId);
    }
  }, [visitorRecordId]);

  useEffect(() => {
    return () => {
      clearTimeout(searchTimer.current);
      clearTimeout(deleteBTDataTimer.current);
      stopDevice();
      closeBluetoothAdapter();
    };
  }, []);

  // usePageShow(() => {
  // // 可以起作用
  //   console.log('.....触发了usePageShow');
  // });

  // 根据接口返回的用户数据判断当前是否能继续执行开门程序
  const handleCanOpenDoor = (isShowToast?: boolean) => {
    if (curBTDataStatesRef.current.isEmpty) {
      isShowToast &&
        wx.showToast({
          title: '门禁未授权，或配置错误，请联系管家',
          icon: 'none',
        });
      return false;
    } else if (curBTDataStatesRef.current.isAllDisabled) {
      isShowToast &&
        wx.showToast({
          title: '门禁已停用，请联系管家',
          icon: 'none',
        });
      return false;
    }
    return true;
  };

  const handleFinishOpenDoor = () => {
    wx.hideLoading();
    if (isOpening.current) {
      isOpening.current = false;
      clearTimeout(openDoorTimer.current);
      openDoorTimer.current = null;
    }
  };

  const handleOpenDoorFn = debounce(() => {
    const canOpenDoor = handleCanOpenDoor(true);
    if (!canOpenDoor) return;
    openingNameMap.current = {};
    reportedNameMap.current = {};

    console.log('.....当前搜索到的的蓝牙设备', blueDevices.current);
    console.log('.....当前用户的蓝牙数据', userBTDataMap.current);
    console.log('.....hasInitBTAdapter', hasInitBTAdapter.current);
    console.log('.....searchTimer', searchTimer.current);

    isOpening.current = true;
    openTime.current = Date.now();
    curRecordId.current = generateRandom(openTime.current);
    wx.showLoading({
      title: '开门中...',
      mask: true,
    });
    openDoorTimer.current = setTimeout(() => {
      handleFinishSearch();
    }, 5000);
    // 如果有已搜索到的蓝牙设备数据，就执行开门操作，并不需要兜底的条件分支，因为有isOpening标识，如果当前是在搜索中，就会自动进入开门程序
    if (JSON.stringify(blueDevices.current) !== '{}') {
      const matchRes = Object.values(userBTDataMap.current).filter(ub => {
        const curMatchBTData = blueDevices.current[ub.deviceAddress];
        if (!!curMatchBTData) {
          handleOpenDoor(ub, curMatchBTData);
          return true;
        }
        return false;
      });
      // 无匹配的，同时当前未在搜索设备中
      if (!matchRes?.length && searchTimer.current === null) {
        handleFinishOpenDoor();
        wx.showToast({
          title: '门禁未授权，或配置错误，请联系管家',
          icon: 'none',
        });
      }
      // 如果当前在执行清除蓝牙设备信息的计时器，就重新开始计时
      if (matchRes?.length && deleteBTDataTimer.current !== null) {
        resetDeleteBTDataTimer();
      }
    } else if (
      JSON.stringify(blueDevices.current) === '{}' &&
      (!hasInitBTAdapter.current || searchTimer.current === null)
    ) {
      // 当前蓝牙设备数据为空，同时当前不处于搜素蓝牙设备中
      init();
    }
  }, 200);

  return (
    <View className={styles.btn} onClick={handleOpenDoorFn}>
      一键开门
    </View>
  );
}

