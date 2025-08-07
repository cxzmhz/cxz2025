import { getInteractiveDetail, getSupportLanguage } from '@/axios/interactive'
import { getAnswer, getSDKConfig } from '@/axios/taskRobot'
import { useSetState } from '@/hooks'
import { throttle } from 'lodash-es'
import { uuid4 } from '@sentry/utils'
import { Input, Modal, message } from 'antd'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import {
  FrameEnum,
  IPageState,
  ISDKState,
  animationStateEnum,
  heartText,
  speakModeEnum,
  LiveRoomDialogType
} from './types'
// import { Client } from 'trtc-js-sdk'
import { useTXRtc } from './useTCRtc'
import Controller from './Model/Recognizer'
import Wss from './websorcket'
import { getSocketError, startRtc, startSyncRtc, stopSyncRtc, rtcModelPreHeat } from '@/axios/rtc'
import {
  ENDING_SPEECH_TIMEOUT,
  NO_SPEECH_TIME,
  NO_SPEECH_TIMEOUT,
  defauleImage,
  defaultText,
  defaultText2,
  wordLimit,
  MAXRECONNECT,
  RECONNECTINTERVAL,
  smallWindowBg
} from './constants'
import {
  checkWaitList,
  getAppletSupportLanguage,
  getChatTicket,
  getappConfig,
  saveLog,
  startappRtc,
  stopRtcApp
} from '@/axios/appRtc'
import {
  getPublishInfo,
  getappAnswer,
  getappCardInfo,
  getappUserInfo,
  rtcReport,
  postCostReport,
  postCostRecord,
  getAppletRmList,
  stopRtc,
  startAppletSyncRtc,
  stopAppletRtc,
  rtcModelPreHeatApplet
} from '@/axios/applet'
import { getUserInfo } from '@/axios/user'
import { ITransparentVideoRef } from '@ice-components/transparent-video'
import { isInMiniprogram } from '@/utils/wx'
import { IRain } from './hooks/typs'
import sentry, { EReportModule } from '@/plugins/sentry'
import { IAnswer, useAskStream } from './hooks/useAskStream'
import dialogController from './Model/DialogController'
import { random30, uuid4V1 } from './utils'
import configTextStore from '@/stores/configText'
import styles from './index.module.less'
import VideoManager from './Model/VideoManager'
import eventTracking, { ETrackingEventName } from '@/plugins/eventTracking'
import { getResourceList } from '@/axios/system'
import { LACK_RIGHTS_DATA_CODE } from '@/constants/rtc'

import { ENewQuotaType } from '@/constants/user'
import { getCookie } from '@/utils/cookie'
import { loadScript } from '@/utils/tools'
import { checkIsJSON, isAppleDevice } from '@/utils/utils'

const SDKEffects = (
  tvRef: React.RefObject<ITransparentVideoRef>,
  setRains: React.Dispatch<React.SetStateAction<IRain[]>>,
  startRains: () => void,
  loadingAudio: React.RefObject<HTMLAudioElement | null>,
  guideController: {
    showGuide: () => void
    closeGuide: () => void
    switchGuide: () => void
    waitShowGuide: (firstHot?: React.MutableRefObject<boolean>) => void
    cancelWaitShowGuide: () => void
  },
  audioHandle: {
    changeAudioStatus: () => void
    playAudio: () => void
    pauseAudio: () => void
    stopAudio: () => void
    closeV: () => void
    openV: () => void
  }
) => {
  const params = useParams<{ project: string }>()
  const [state, setState] = useSetState<ISDKState>({
    test: false,
    init: false,
    listening: false,
    bgm: '',
    bgVideo: {
      volume: 0,
      loop: true,
      videoUrl: '',
      videoPoster: ''
    },
    color: {
      primaryColor: '#5991FF',
      secondaryColor: '#5991FF'
    },
    chating: true,
    speaking: false,
    asring: false,
    asrModal: true,
    chatList: [],
    chatValue: '',
    loading: false,
    //加载页面
    pageLoad: true,
    loadPercentage: 0,
    animationState: animationStateEnum.STATIC,
    isBusy: false,
    stt: '',
    connect: false,
    mediaData: null,
    carArea: '',
    eleFeedArea: '',
    status: 'recording',
    displayImages: [],
    displayTexts: [],
    human: { Height: 0, Width: 0, X: 0, Y: 0, mediaUrl: '', webIndex: 1, zIndex: 1 },
    companyId: '',
    createUserId: '',
    videoRatio: '',
    videoSize: { width: 0, height: 0 },
    globalImage: [],
    globalTexts: [],
    globalVideo: [],
    globalAudio: null,
    displayAudio: null,
    displayVideo: [],
    emoje: '',
    bigBrainImg: '',
    emojiType: 0,
    startAction: defauleImage,
    closeAction: defauleImage,
    modeAction: defauleImage,
    preAns: '',
    chunkAns: '',
    liveRoomChatList: [],
    preQue: '',
    canUse: true,
    checked: false,
    // TODO cardinfo 业务逻辑，h5 和小程序会有不用的卡片信息接口
    cardInfo: {
      companyName: '',
      avatarImageUrl: '',
      name: '',
      roles: [''],
      simpleDesc: '',
      telephone: 'string'
    },
    ttsLanguage: '普通话',
    asrHotWords: [],
    asrHotWordTableId: undefined,
    loadingUrl: '',
    callWaitingData: undefined, //等待状态数据
    interactiveModes: [0, 1, 2],
    mode: 'work',
    hobbies: [''],
    waitOrStart: 'pre',
    ticketInfo: {},
    showModeMask: false,
    showpreAns: '',
    thinkImg: '',
    overTwo: '',
    holdOn: false,
    liveOrMatt: 'matt',
    isRecorderOpen: false,
    isThinking: false,
    /**
     * 模糊背景（使用项目封面图）
     */
    previewImage: '',
    subtitlesIsShow: true,
    // todo 安静模式下持续监听语音，吵杂模式下使用微信点击按钮才会说语音的逻辑，用户主动切换
    speakMode: speakModeEnum.QUIET,
    vodeoPlaying: false,
    isInteractivePath: true,
    products: null,
    cardUiTemplate: '',
    selectLanguage: {},
    languageOptions: [],
    languageDrawer: false
  })
  // todo 这个参数的意义暂时不明
  const isIdlingMessageSentRef = useRef(false)
  const idlingTimeoutRef = useRef<number | undefined>(0)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const costRecordTime = useRef(0)
  const stopIdlingTimer = useCallback(() => {
    if (idlingTimeoutRef.current) {
      clearTimeout(idlingTimeoutRef.current)
      idlingTimeoutRef.current = undefined
    }
  }, [])
  // todo 数字人说完话后触发，空闲20s后就会播放结束语的逻辑，保留，不过要看下是不是跟2.0超时断连逻辑冲突
  const startIdlingTimer = useCallback(() => {
    stopIdlingTimer()
    if (isIdlingMessageSentRef.current) {
      return
    }
    idlingTimeoutRef.current = setTimeout(() => {
      if (isIdlingMessageSentRef.current) {
        return
      }
      setState({
        asring: false,
        speaking: true,
        preAns: '',
        chunkAns: ''
      })
      isIdlingMessageSentRef.current = true
      console.log('fetching ending message')
      getChatAnswer('', 'sys.no-input-default')
    }, ENDING_SPEECH_TIMEOUT)
  }, [stopIdlingTimer])

  //门票
  const ticket = useRef<string>('')
  const isMini = useRef<boolean>(isInMiniprogram())
  const humanInstanse = useRef<any>(null)
  const welcomeRef = useRef('')
  const inputRef = useRef<Input | null>(null)
  const sessionIdRef = useRef(uuid4())
  const humanRef = useRef(null)
  const cache = useRef<{
    player: any | null
    controller: any
    authInfo: any
    webSorcket: WebSocket | undefined
    audio: HTMLAudioElement | null
    playing: boolean
    connect: boolean
  }>({
    player: null,
    controller: null, // 语音识别
    authInfo: {}, // 主播房间信息
    webSorcket: undefined, // sorcket实例
    audio: null,
    playing: false,
    connect: false
  })
  const dialogueId = useRef('')
  const uu = useRef(uuid4())
  const sessionId = useRef<string>('')
  const algUserIdRef = useRef('')
  const textRef = useRef('')
  const communication = useRef<string>(uuid4())
  const reConnectTimerRef = useRef<any>(0)
  const statusRef = useRef<typeof state.status>(state.status)
  const speakRef = useRef(false)
  const userInfo = useRef<any>({})
  // const isBreak = useRef(0)
  const displayImageRef = useRef([])
  const displayTextRef = useRef([])
  const displayVideoRef = useRef([])
  const backgroundMusicRef = useRef(null)
  const noBreakRef = useRef<boolean>(true)
  const ListenSpeechTimer = useRef<number | undefined>(0) // 监听长时间无语音操作
  const startSpeechTime = useRef<number>(0) // 开始操作语音或者文本的时间
  const startSpeechTime2 = useRef<number>(0) // 开始操作语音或者文本的时间
  const ListenSpeechTimer2 = useRef<number | undefined>(0)
  const welcomeMesID = useRef<string | undefined>('')
  const appuser = useRef<any>({})
  const param = new URLSearchParams(location.search)
  const mini = param.get('mini')
  /**记录开始时间戳*/
  const startTimer = useRef<number>(0)
  const dialogRef = useRef<dialogController | null>(null)
  /**记录最后一句说话的内容*/
  const lastText = useRef<string>('')
  /** 记录taskId */
  const taskIdRef = useRef<string>('')
  /** 记录用户的ID */
  const userIdRef = useRef<string>('')
  /** 记录traceId */
  const traceIdRef = useRef<string>('')
  // 记录语言类型
  const languageRef = useRef('')
  const { streamController, streamList } = useAskStream({
    sessionIdRef,
    projectId: params.project,
    dialogRef,
    taskIdRef,
    userIdRef,
    traceIdRef,
    languageRef
  })

  const waitTextRef = useRef('')
  const noUseing = useRef(true)
  const cacheLog = useRef(new Map())
  //记录第一次卡片提示
  const firstHot = useRef(false)
  //当前模式Ref
  const speakModeRef = useRef<speakModeEnum>(speakModeEnum.QUIET)
  const loadingVideoRef = useRef<any>(null)
  //记录所谓首帧时间
  const firstFrameTime = useRef(0)
  //  记录所谓首次返回值的首帧的map
  const firstReplyFrameTimeMap = useRef(new Map())
  //  记录端到端打点
  const endToEndTimeMap = useRef(new Map())
  // todo 1.0版本里面监听视频播放的逻辑，不用了
  const VideoManagerRef = useRef<any>(
    new VideoManager(
      () => handle.onVideoStart(),
      () => handle.onAllVideosEnd()
    )
  )
  // 表示ID 保证 start config 拉取socket 使用一致
  const multiInstanceModeFlag = useRef('')
  // 记录ws重连次数
  const reconnectAttempts = useRef(0)
  // 冷数据启动处理
  const rtcModelPreHeatJudgeResult = useRef(false)
  // todo 记录打点信息，需要转移到2.0的回调里
  const frameTimeLogList = useRef<any>([])
  if (mini) {
    isMini.current = true
  }
  useEffect(() => {
    speakModeRef.current = state.speakMode
  }, [state.speakMode])

  useEffect(()=>{
    languageRef.current = state?.selectLanguage?.brainCode
  },[state?.selectLanguage?.brainCode])

  // todo 处理用户的身份信息
  useLayoutEffect(() => {
    dialogueId.current = uuid4()
    const appletLoginSessionId = param.get('appletLoginSessionId')
    if (appletLoginSessionId)
      document.cookie =
        'appletLoginSessionId=' +
        appletLoginSessionId +
        ';expires=' +
        new Date().setMilliseconds(new Date().getMinutes() + 3600).toLocaleString() +
        ';path=/;'
  }, [])

  // todo 1.0的逻辑，不用了
  const joinThen = () => {
    const clickCostMillis = new Date().getTime() - costRecordTime.current
    postCostReport({
      publishType: 'card',
      clientType: isMini.current ? 'applet' : 'web',
      preview: !Boolean(isMini.current),
      taskId: taskIdRef?.current,
      projectId: params.project,
      userId: userIdRef.current,
      statisticBizType: 200,
      costMillis: clickCostMillis,
      extras: {}
    })
    audioHandle.closeV()
    if (!state.connect) {
      setState({
        connect: true,
        animationState: animationStateEnum.SPEAKING
      })
    }
    getWelcome('work')
  }
  /** ws消息监听 */
  // todo 1.0的逻辑，不用了
  const judgeWsPayload = async (e: any) => {
    const { type, id, content, fragment_id } = e
    if (content === heartText.PONG) return
    if (type === FrameEnum.INTERACTIVE_DURATION) {
      message.warning({
        content: '交互时长权益已达上限，请联系客户服务升级',
        key: 'toast',
        className: styles['rtc_toast'],
        icon: <></>
      })
      handle.cutLine()
      return
    }
    judgeSEIPayload({ ...e, text: content })
    console.log('isAppleDevice', isAppleDevice, navigator?.userAgent)
    // 如果是ios设备走ws消息派发，因为ios设备的sei消息接收不到
    // if (isAppleDevice) {
    // judgeSEIPayload({ ...e, text: content })
    // }
  }
  /** sei消息监听 */
  // todo 1.0的钩子，里面的业务逻辑要转移到2.0的回调里
  const judgeSEIPayload = async (e: any) => {
    const { type, id, text: content, fragment_id } = e
    //记录峰值时间用来打点
    frameTimeLogList.current.push({
      type,
      content,
      sessionId: id,
      fragment_id,
      current_time: new Date().getTime()
    })
    if (type === FrameEnum.FIRST_FRAME) {
      //是首帧进行记录上报
      try {
        const endToEndTime = endToEndTimeMap.current.get(id)
        console.log('FrameEnum.FIRST_FRAMEFrameEnum.FIRST_FRAMEFrameEnum.FIRST_FRAME', endToEndTimeMap.current)
        if (endToEndTime) {
          const costMillis = new Date().getTime() - endToEndTime
          endToEndTimeMap.current.delete(id)
          if (costMillis > 15000) {
            sentry.report?.warning(
              {
                module: EReportModule.Rtc,
                keyword: `端到端前端打点超15s`,
                extra: {
                  projectId: params.project,
                  payload: JSON.stringify(e || {}),
                  mapTime: endToEndTimeMap,
                  frameTimeLogList: frameTimeLogList.current,
                  queryId: fragment_id,
                  askId: id
                }
              },
              new Error(`端到端前端打点超15s `)
            )
          }
          postCostReport({
            publishType: 'card',
            clientType: isMini.current ? 'applet' : 'web',
            preview: !Boolean(isMini.current),
            taskId: taskIdRef?.current,
            projectId: params.project,
            userId: userIdRef.current,
            statisticBizType: 108,
            costMillis,
            extras: {
              answerSource: '',
              modelType: '',
              interactiveType: 5,
              askId: sessionIdRef.current,
              rtcType: 1,
              rtcId: id,
              fragmentId: fragment_id
            }
          })
        }

        const mapTime = firstReplyFrameTimeMap.current.get(fragment_id)
        //如果有mapTime，说明是首帧
        if (mapTime) {
          const costMillis = new Date().getTime() - mapTime
          if (costMillis > 5000) {
            // todo sentry的上报信息，跟交互sdk页面里面一样，需要处理保留，优先级不高
            sentry.report?.warning(
              {
                module: EReportModule.Rtc,
                keyword: `首帧前端打点超5s`,
                extra: {
                  projectId: params.project,
                  payload: JSON.stringify(e || {}),
                  mapTime: mapTime,
                  frameTimeLogList: frameTimeLogList.current,
                  queryId: fragment_id,
                  askId: id
                }
              },
              new Error(`首帧前端打点超5s `)
            )
          }
          postCostReport({
            publishType: 'card',
            clientType: isMini.current ? 'applet' : 'web',
            preview: !Boolean(isMini.current),
            taskId: taskIdRef?.current,
            projectId: params.project,
            userId: userIdRef.current,
            statisticBizType: 106,
            costMillis,
            extras: {
              fragmentId: fragment_id,
              interactiveType: 5,
              askId: sessionIdRef.current,
              rtcType: 1,
              rtcId: id
            }
          })
          //记录完毕后，重置，等下一次首帧
          firstReplyFrameTimeMap.current.delete(fragment_id)
        }
      } catch (error) {}

      //是首帧进行记录结束
      cache.current?.controller?.stopHandleRecognitionResult?.()
      // todo 聊天记录，业务逻辑，放在ontalkstart里
      const getLiveRoomChatList = ({
        id,
        liveRoomChatList,
        content
      }: {
        id: string
        liveRoomChatList: any[]
        content: string
      }) => {
        const cur = liveRoomChatList.find((i) => i.id === id && i.type === LiveRoomDialogType.ANSWER)
        if (cur) {
          cur.content = content
        } else {
          liveRoomChatList = [...liveRoomChatList, { type: LiveRoomDialogType.ANSWER, id, content }]
        }
        return [...liveRoomChatList]
      }

      const trimEndingPunctuation = (str: string) => {
        // 匹配字符串末尾的逗号、句号或分号，如果有的话去掉
        return str.replace(/[，。；]$/, '')
      }
      setState((preState) => {
        return {
          preAns: content ? preState.preAns + content : preState.preAns + cacheLog.current.get(id),
          liveRoomChatList: getLiveRoomChatList({
            id,
            liveRoomChatList: preState.liveRoomChatList,
            content: content ? preState.preAns + content : preState.preAns + cacheLog.current.get(id)
          }),
          chunkAns: trimEndingPunctuation(content ? content : cacheLog.current.get(id)),
          speaking: true,
          asring: false,
          preQue: '',
          displayImages: displayImageRef.current,
          displayTexts: displayTextRef.current,
          displayAudio: backgroundMusicRef.current,
          displayVideo: displayVideoRef.current,
          // 接收到首帧后 正在思考的 loading 消失
          isThinking: false
        }
      })
      // displayImageRef.current = []
      // displayTextRef.current = []
      // displayVideoRef.current = []
      backgroundMusicRef.current = null
      textRef.current = ''
      speakRef.current = true
      // isBreak.current = 1
      handleDo()
      // 收到首帧的时候，就可以打断了
      noBreakRef.current = false
      // if (new Date().getTime() - firstFrameTime.current > 25000) {
      //   sentry.report?.error(
      //     {
      //       module: EReportModule.Rtc,
      //       keyword: '首帧返回超过25s，时间为' + (new Date().getTime() - firstFrameTime.current)
      //     },
      //     e
      //   )
      // }
    }
    if (type === FrameEnum.LAST_FRAME) {
      const noPlaying = VideoManagerRef.current.checkAllVideos()
      console.log('====================================')
      console.log('lastText', lastText.current, 'content', content, 'id', id)
      console.log('====================================')
      // id代表这一轮对话的id
      const curDialog = streamList.current.get(id)
      // dialogList代表这一轮对话保存的切分句子，从roundDialogs里拿，roundDialogs只在state为2时候保存下来
      const dialogList = curDialog?.roundDialogs?.get(id)
      console.log('curry--->dialogList', dialogList, fragment_id)
      /** content为null目前只发现开场白很长的时候，服务端会返回null，此时也进入这个分支 */
      /** fragment_id为单个断句的id，如果fragment_id等于这一轮最后对话的断句fragment_id，则进入收音 */
      if (content === null || fragment_id === dialogList?.[dialogList?.length - 1]?.id) {
        streamList.current.delete(id)
        setRains([])
        //开始被动拾音
        // todo asr的逻辑，数字人说完话了，就要开始被动拾音
        if (noPlaying) {
          handle.quietModeOpenAdapterization()
        }
        if (!firstHot.current) {
          guideController.waitShowGuide(firstHot)
        }
        const newState: any = {
          speaking: false,
          asring: true,
          // displayImages: [],
          // displayTexts: [],
          // displayAudio: {},
          thinkImg: {},
          // displayVideo: [],
          // emoje: '',
          emojiType: 0,
          checked: false
        }
        setState(newState)
        textRef.current = ''
        speakRef.current = false
        startIdlingTimer()
        // isBreak.current = 0
        handleDo()
      }

      if (id === welcomeMesID.current) {
        setState({ asring: true })
        // noBreakRef.current = false
        guideController.showGuide()
        welcomeRef.current = ''
        //开始被动拾音
        handle.quietModeOpenAdapterization()
      }
    }
  }
  const { TCJoin, leave, destroy, getConfigRef, sourceRef } = useTXRtc(
    cache,
    uu,
    algUserIdRef,
    setState,
    sessionId,
    params,
    joinThen,
    tvRef,
    startTimer,
    audioHandle,
    state,
    judgeSEIPayload
  )

  // useAudioAndVideo(state)

  useEffect(() => {
    scrollIntoBottom(`.${styles['long-conten']}`)
  }, [state.showpreAns])

  // todo 1.0的逻辑，不用了
  const handleDo = () => {
    stopInterval()
    startSpeechTime.current = new Date().getTime()
    ListenSpeechTimer.current = setInterval(() => {
      if (speakRef.current) {
        handleDo()
        console.log('speaking')
        sendMessage(heartText.PING, 'heartbeat')
        return
      }
      sendMessage(heartText.PING, 'heartbeat')
      console.log('handleDo')
      if (new Date().getTime() - startSpeechTime.current > NO_SPEECH_TIME) {
        console.log('超时')
        handle.cutLine()
      }
    }, 1000)
  }

  const stopInterval = () => {
    if (ListenSpeechTimer.current) {
      clearInterval(ListenSpeechTimer.current)
      ListenSpeechTimer.current = undefined
    }
  }

  // atten 初始化asr，不用处理
  const initController = async () => {
    const controller = new Controller()
    cache.current.controller = controller
    const appletLoginSessionId = param.get('appletLoginSessionId')
    return await controller.init({
      id: params.project,
      userId: appletLoginSessionId ? appletLoginSessionId : '',
      source: 1
    })
  }

  // atten 获取cardInfo
  useEffect(() => {
    setTimeout(() => {
      !isMini.current
        ? getPublishInfo(params.project, true)
            .then((res) => {
              setState({
                cardInfo: {
                  ...res
                }
              })
            })
            .then(() => {
              getConfig()
            })
        : getappCardInfo(params.project)
            .then((res) => {
              setState({
                cardInfo: {
                  ...res
                }
              })
            })
            .then(() => {
              getConfig()
            })
    }, 50)

    return () => {
      handle.cutLine()
    }
  }, [])
  // atten 小程序页面隐藏的销毁逻辑
  useEffect(() => {
    if (!isInMiniprogram()) return
    // 小程序页面销毁关闭
    const WeixinJSBridge = (window as any).WeixinJSBridge
    if (!WeixinJSBridge) return

    WeixinJSBridge.on('onPageStateChange', (res: any) => {
      console.log('res is active', res.active)
      if (!res?.active) {
        handle.cutLine()
      }
    })
  }, [(window as any).WeixinJSBridge])

  useEffect(() => {
    if (state.animationState === animationStateEnum.INPUT) {
      inputRef.current?.focus?.()
    }
  }, [state.animationState])

  useEffect(() => {
    scrollIntoBottom(`.${styles['chat-list']}`)
  }, [state.chatList])

  const asrEndingPunctuation = (str: string | undefined) => {
    if (!str) return ''
    // 匹配字符串末尾的句号，如果有的话去掉
    return str.replace(/[。]$/, '')
  }
  const newRecognized = async (e: any) => {
    const text = e.detail
    //新增V3.0.3
    if (speakModeRef.current === speakModeEnum.QUIET) {
      handle.handleConfirmRecognition(text)
      return
    }
    if (
      text &&
      (statusRef.current === 'recording' || statusRef.current === 'recognizing' || statusRef.current === 'continuing')
    ) {
      textRef.current += text
      setState({
        preQue: asrEndingPunctuation(textRef.current)
      })
    }
  }

  const recnizing = async (e: any) => {
    guideController.cancelWaitShowGuide()
    const text = e.detail
    if (text) {
      isIdlingMessageSentRef.current = false
    }
    if (
      text &&
      (statusRef.current === 'recording' || statusRef.current === 'recognizing' || statusRef.current === 'continuing')
    ) {
      handleDo()
      stopIdlingTimer()
      const currentText = `${textRef.current}${text}`
      const newText = asrEndingPunctuation(currentText)
      setState((pre) => ({
        preQue: newText,
        asring: true,
        preAns: '',
        chunkAns: '',
        liveRoomChatList: getLiveRoomChatAsr(pre.liveRoomChatList, newText)
      }))
      // VideoManagerRef.current.clear()
    }
  }

  // 直播模式下asr文本拼接
  const getLiveRoomChatAsr = (liveRoomChatList: any[], text: string) => {
    // 判断数组最后一项是否是asr类text
    const last = liveRoomChatList?.[liveRoomChatList?.length - 1]
    let result: any[] = []
    if (last?.type !== LiveRoomDialogType.ASK) {
      result = [...liveRoomChatList, { type: LiveRoomDialogType.ASK, content: text }]
    } else {
      last.content = text
      result = [...liveRoomChatList]
    }
    return result
  }

  const recnize = (e: any) => {
    handleDo()
    setState({
      asring: true,
      preQue: ''
      // preAns: ''
    })
    waitTextRef.current = ''
  }

  const recognizeTimeout = (e: any) => {
    message.warning({
      content: '我没有听清哦，请重试',
      key: 'toast',
      className: styles['rtc_toast'],
      icon: <></>
    })
    handle.handleCancelRecognition()
  }

  useEffect(() => {
    window.addEventListener('recognized', newRecognized)

    window.addEventListener('recognizing', recnizing)

    window.addEventListener('start-recognize', recnize)

    window.addEventListener('recognize-timeout', recognizeTimeout)

    return () => {
      window.removeEventListener('recognized', newRecognized)
      window.removeEventListener('recognizing', recnizing)
      window.removeEventListener('start-recognize', recnize)
      window.removeEventListener('recognize-timeout', recognizeTimeout)
    }
  }, [state.mode])

  /** 判断小程序环境下是否有交互路数权益 */
  const getQutoa = async () => {
    if (!isMini.current) return
    const res = await getAppletRmList(params.project)
    const interactiveMes = res?.find((i: any) => i?.resourceCode === ENewQuotaType.CardWayCount)
    setState({
      isInteractivePath: Boolean(interactiveMes?.total)
    })
  }

  useEffect(() => {
    getQutoa()
  }, [])

  /** 连接&断开: 背景视频 */
  // todo 业务逻辑，需要在2.0的回调里更新状态state对应的状态
  useEffect(() => {
    if (!bgVideoRef.current) return
    if (state.connect && state.init) {
      bgVideoRef.current.volume = state.bgVideo?.volume
      bgVideoRef.current.play()
    } else {
      bgVideoRef.current.currentTime = 0
      bgVideoRef.current.pause()
    }
  }, [state.connect, state.init])

  // 重连
  const reconnect = () => {
    if (reconnectAttempts.current < MAXRECONNECT) {
      reconnectAttempts.current++
      setTimeout(() => {
        handle.joinChannle()
      }, RECONNECTINTERVAL)
    } else {
      handle.cutLine()
      // todo 不再使用了
      getSocketError(isMini.current ? params.project + '*' + appuser.current?.id : params.project)
        .catch((info) => {
          sentry.report?.error(
            {
              module: EReportModule.Rtc,
              keyword: 'websorcket连接失败原因不明'
            },
            info
          )
          console.log(info)
        })
        .then(async (res: any) => {
          const webStaffText = configTextStore.customizeText.webStaffText || '数字员工'
          if (res?.code) {
            const { code, message: error } = res
            switch (code) {
              case 617:
                message.warning({
                  content: webStaffText + '正忙，请稍候',
                  key: 'toast',
                  className: styles['rtc_toast'],
                  icon: <></>
                })
                break
              case 611:
                message.warning({
                  content: '当前有预览任务在运行中，请关闭后再启动新的预览',
                  key: 'toast',
                  className: styles['rtc_toast'],
                  icon: <></>
                })
                break
              case 629:
                message.warning({
                  content: '交互时长权益已达上限，请联系客户服务升级',
                  key: 'toast',
                  className: styles['rtc_toast'],
                  icon: <></>
                })
                break
              default:
                console.log(error)
            }
          } else {
            sentry.report?.error(
              {
                module: EReportModule.Rtc,
                keyword: 'websorcket连接失败原因不明'
              },
              res
            )
            console.log('网络线路故障，请重试')
          }
        })
    }
  }
  // 开始任务
  const beginStart = async () => {
    // todo 业务逻辑，后面直接在这个函数调用2.0 的startRTC方法，下面的业务逻辑保留
    setState({
      animationState: animationStateEnum.LOADING,
      waitOrStart: 'start',
      holdOn: false
    })
    if (loadingAudio.current && loadingAudio.current?.paused) {
      audioHandle.playAudio()
    }
    // todo 1.0逻辑，不用了
    try {
      //开始rtc
      const apiFn = isMini.current ? startAppletSyncRtc : startSyncRtc
      const res = await apiFn({
        businessId: multiInstanceModeFlag.current,
        projectId: params.project,
        taskId: multiInstanceModeFlag.current
      })
      console.log('startRtc=====success=====', res)
      taskIdRef.current = res?.taskId || ''
      userIdRef.current = res?.extra?.userId || ''
      TCJoin(res)
    } catch (e: any) {
      console.log('startRtc=====error=====', e)
      handle.resetPage()
      cache.current.webSorcket?.close?.()
      cache.current.webSorcket = undefined
      if (e.code == 830) {
        message.warning({
          content: '您的交互路数权益已达上限',
          key: 'toast',
          className: styles['rtc_toast'],
          icon: <></>
        })
      }
      // todo sentry的上报信息，跟交互sdk页面里面一样，需要处理保留，优先级不高
      sentry.report?.error(
        {
          module: EReportModule.Rtc,
          keyword: '拉起RTC失败(调用start)'
        },
        e
      )
      // todo 小程序的上报，看下是不是放在sdk2.0的代码里面处理
      if (isMini.current) {
        rtcReport({
          userId: new URLSearchParams(window.location.search)?.get('userId') || algUserIdRef.current,
          event: {
            eventValue: JSON.stringify({
              isSuccess: false,
              startRtc: e.message,
              eventName: 'startRtc',
              time: new Date().getTime() - startTimer.current
            }),
            eventTimestamp: new Date().getTime()
          }
        })
      }
    }
  }

  // todo 1.0的逻辑，不用了
  const getWebsocket = () => {
    const param = new URLSearchParams(location.search)
    const token: string = isInMiniprogram()
      ? param.get('appletLoginSessionId') || ''
      : getCookie('loginSessionId') || ''
    const tokenType = isInMiniprogram() ? 2 : 3
    const taskId = multiInstanceModeFlag.current
    const instance = new Wss({ token, tokenType, taskId }).instance
    return instance
  }

  // todo 1.0的逻辑，不用了，不过里面的isIdlingMessageSentRef和stopIdlingTimer逻辑要看下要不要处理
  const socketListen = async () => {
    if (!cache.current.webSorcket) {
      cache.current.webSorcket = getWebsocket()
      if (!cache.current.webSorcket) return
    }
    setState({
      animationState: animationStateEnum.LOADING
    })
    cache.current.webSorcket.onmessage = (e) => {
      judgeWsPayload(JSON.parse(e.data))
    }
    cache.current.webSorcket.onerror = (e) => {
      stopInterval()
      stopIdlingTimer()
      isIdlingMessageSentRef.current = false
      reconnect()
    }
    cache.current.webSorcket.onclose = (e) => {
      console.log(e, e.reason)
      stopInterval()
      stopIdlingTimer()
      isIdlingMessageSentRef.current = false
      // 正常关闭
      if (e.code === 1000) {
        handle.resetPage()
      } else {
        reconnect()
      }
    }
    cache.current.webSorcket.onopen = async () => {
      reconnectAttempts.current = 0
      startTimer.current = new Date().getTime()
      handleDo()
    }
  }

  const getConfig = async () => {
    // todo 这个接口2.0调了，但是这里有业务逻辑也需要接口里的数据，所以保留，可以看下交互sdk里怎么处理这块逻辑
    const res = !isMini.current ? await getInteractiveDetail(params.project, true) : await getappConfig(params.project)
    // todo 这个是业务逻辑，需要保留
    const languages = !isMini.current
      ? await getSupportLanguage(res?.dataJson?.canvasData?.iceScenes?.tts?.timbre)
      : await getAppletSupportLanguage(res?.dataJson?.canvasData?.iceScenes?.tts?.timbre)
    setState({
      languageOptions: languages || [],
      selectLanguage: languages?.[0]
    })
    if (res?.dataJson && res?.companyId) {
      // const mockRes = {
      //   ...res,
      //   asrHotTableInfo: {
      //     hotWordDetails: [{
      //       hotWord: '开画',
      //       weight: 10,
      //     }],
      //   }
      // }
      const {
        asrHotTableInfo,
        companyId,
        createUserId,
        dataJson: { canvasData, csPersonDesign, config, callPageConfig }
      } = res
      const {
        videoRatio,
        videoSize,
        iceScenes: {
          backgroundImage,
          backgroundVideo,
          displayImages,
          displayTexts,
          displayVideos = [],
          backgroundMusic = {},
          virtualHuman: { attributes },
          tts = { voiceProvider: '' },
          previewImage
        },
        cardUiTemplate
      } = canvasData
      noUseing.current = tts?.voiceProvider !== 'VH_XIAOBING'
      setState({
        init: false,
        bgm: backgroundImage?.mediaUrl,
        bgVideo: {
          loop: backgroundVideo?.loop,
          volume: backgroundVideo?.attributes?.videoVolume,
          videoUrl: backgroundVideo?.mediaUrl,
          videoPoster: backgroundVideo?.attributes?.mediaUrl
        },
        human: attributes,
        companyId,
        createUserId,
        videoRatio,
        videoSize,
        globalImage: displayImages,
        globalTexts: displayTexts,
        globalAudio: backgroundMusic,
        globalVideo: displayVideos,
        startAction: displayImages.find((image: any) => image.attributes.toolType === 'startAction') || defauleImage,
        closeAction: displayImages.find((image: any) => image.attributes.toolType === 'closeAction') || defauleImage,
        modeAction: displayImages.find((image: any) => image.attributes.toolType === 'modeAction') || defauleImage,
        hobbies: csPersonDesign?.hobbies,
        loadingUrl: config?.loadingUrl || '',
        callWaitingData: (callPageConfig?.callWaitingItems || []).find((item: any) => item?.selected) || undefined,
        interactiveModes: config?.interactiveModes || [0, 1, 2],
        mode: defaultText2[config?.interactiveModes?.[0] || 0].value,
        previewImage,
        ttsLanguage: tts.language || '普通话',
        asrHotWords: asrHotTableInfo?.hotWordDetails || [],
        asrHotWordTableId: asrHotTableInfo?.tencentTableId,
        cardUiTemplate
      })
    } else {
      sentry.report?.error(
        {
          module: EReportModule.Rtc,
          keyword: '获取项目配置失败'
        },
        new Error('获取项目配置失败')
      )
    }
    // todo 业务逻辑 保留
    handle.getUserInfoFn()
  }

  // setTimeout(() => {
  //   cache.current.controller?.startHandleRecognitionResult()
  //   console.log("?.startHandleRecognitionResult()",cache.current.controller)
  // }, 1000)

  const testTimer = useRef<any>('')
  const handle = {
    // todo 这个方法是业务逻辑，保留
    getUserInfoFn: async () => {
      if (isMini.current) {
        appuser.current = await getappUserInfo()
      } else {
        userInfo.current = await getUserInfo()
      }
      console.log(
        'getUserInfoFngetUserInfoFn=========',
        'userInfo.current',
        userInfo.current,
        'appuser.current',
        appuser.current
      )
    },
    joinChannle: async () => {
      // if (!state.canUse) return
      if (state.animationState === animationStateEnum.LOADING) return
      //如果这个时候还没获取到，就再获取一次
      console.log('joinChannlejoinChannle', 'userInfo.current', userInfo.current, 'appuser.current', appuser.current)
      if (!appuser.current && !userInfo.current) {
        if (isMini.current) {
          appuser.current = await getappUserInfo()
        } else {
          const res = await getUserInfo()
          userInfo.current = res
        }
      }
      const instance = getWebsocket()
      cache.current.webSorcket = instance
      socketListen()
    },
    resetPage: () => {
      if (loadingAudio.current) {
        audioHandle.stopAudio()
        loadingAudio.current?.pause()
      }
      if (loadingVideoRef?.current) {
        // loadingVideoRef.current?.wantPause?.()
      }
      sourceRef.current?.cancel('用户主动断开')
      setState({
        animationState: animationStateEnum.STATIC,
        listening: false,
        connect: false,
        displayTexts: [],
        displayImages: [],
        displayAudio: null,
        displayVideo: [],
        checked: false,
        thinkImg: {},
        speaking: false,
        preAns: '',
        chunkAns: '',
        liveRoomChatList: [],
        showpreAns: '',
        preQue: '',
        asring: false,
        asrModal: true,
        chatList: [],
        chatValue: '',
        ticketInfo: {},
        mode: defaultText2[state.interactiveModes?.[0] || 0].value,
        showModeMask: false,
        init: false,
        overTwo: '',
        holdOn: true,
        isThinking: false
      })
      VideoManagerRef.current.clear()
      setTimeout(() => {
        setState({
          waitOrStart: 'pre',
          holdOn: false
        })
      }, 1000)
      clearMakeShowpreAns()
      clear()
      cache.current.controller?.stopHandleRecognitionResult?.()
      textRef.current = ''
      speakRef.current = false
      displayImageRef.current = []
      displayTextRef.current = []
      displayVideoRef.current = []
      backgroundMusicRef.current = null
      waitTextRef.current = ''
      stopInterval()
      stopIdlingTimer()
      firstHot.current = false
      noBreakRef.current = true
      leave()
      destroy()
    },
    cutLine: async () => {
      console.log('关闭')
      handle.resetPage()
      cache.current.webSorcket?.close?.()
      cache.current.webSorcket = undefined
      console.log('multiInstanceModeFlag.current', multiInstanceModeFlag.current)
      if (!multiInstanceModeFlag.current) return
      // 挂断后再次主动调用Close
      if (isMini.current) {
        stopAppletRtc({ taskId: multiInstanceModeFlag.current })
      } else {
        stopSyncRtc({ taskId: multiInstanceModeFlag.current })
      }
    },
    endCommunication: () => {
      sendMessage('关闭对话', 'answer')
      console.log('end')
      setState({
        animationState: animationStateEnum.ENDING
      })
    },
    closeBusyModal: () => {
      setState({
        animationState: animationStateEnum.STATIC,
        isBusy: false
      })
      if (cache.current?.audio) {
        cache.current.audio.pause()
        cache.current.audio.load()
      }
      if (reConnectTimerRef.current) {
        clearTimeout(reConnectTimerRef.current)
      }
    },
    changeToASR: () => {
      if (!state.connect) return
      setState({
        animationState: animationStateEnum.SPEAKING,
        asrModal: true
      })
      setState({
        asring: true
      })
    },
    changeToInput: () => {
      if (!state.connect) return
      setState({
        animationState: animationStateEnum.INPUT,
        asrModal: false,
        asring: false
      })
    },
    // todo 这个方法不用了
    rtcModelPreHeatJudge: async () => {
      try {
        let res: any = {}
        if (!isMini.current) {
          res = await rtcModelPreHeat({ projectId: params.project })
        } else {
          res = await rtcModelPreHeatApplet({ projectId: params.project })
        }
        const { coldFile } = res
        if (coldFile) {
          message.warning({
            content: '当前访客较多正在处理中，请稍等我30分钟再联系哦~',
            key: 'toast',
            className: styles['rtc_toast'],
            icon: <></>
          })
          handle.resetPage()
        }
        return coldFile
      } catch (error) {
        return true
      }
    },
    // 点击开始通话
    // todo 1.0里面有的方法，这里耦合了业务逻辑
    clickToStart: async () => {
      try {
        if (loadingVideoRef?.current) {
          loadingVideoRef.current?.play()
        }
        /** 背景视频 */
        if (bgVideoRef.current) {
          bgVideoRef.current.play()
          bgVideoRef.current.volume = 0
        }
      } catch {}
      reconnectAttempts.current = 0
      multiInstanceModeFlag.current = uuid4V1()
      // if (noUseing.current) {
      //   return message.warning('当前音色不支持发起交互，请选择其他音色')
      // }
      if (state.holdOn || cache.current.connect) return
      // todo 这个业务逻辑需要使用的状态
      setState({
        holdOn: true
      })
      isIdlingMessageSentRef.current = false
      cache.current.connect = true
      setTimeout(() => {
        cache.current.connect = false
      }, 1300)
      // 记录点击触发开启时间
      costRecordTime.current = new Date().getTime()
      // todo 初始化asr 需要保留
      initController()
        .then(async () => {
          // const rtcModelPreHeatJudgeRes = await handle.rtcModelPreHeatJudge()
          // if (rtcModelPreHeatJudgeRes) return
          if (isMini.current) {
            //TODO:恢复
            if (state.waitOrStart === 'loading') return
            setState({
              waitOrStart: 'loading'
            })
            await getTicket()
          } else {
            handle.joinChannle()
            beginStart()
          }
        })
        .catch((err) => {
          setState({
            holdOn: false
          })
          if (err === 'allow') {
            const modeal = Modal.confirm({
              closable: true,
              title: '麦克风权限未开启',
              content: (
                <>
                  <div>无法录制声音，“点击通话”按钮允许麦克风权限后继续使用</div>
                  <div className="I-know" onClick={() => modeal.destroy()}>
                    我知道了
                  </div>
                </>
              ),
              okText: '确认',
              className: 'get-mircorphone-modal',
              maskClosable: true,
              centered: true,
              closeIcon: <iconpark-icon name="guanbiduihuakuang" size={'20px'}></iconpark-icon>
            })
          } else {
            const modeal = Modal.confirm({
              closable: true,
              title: '无法获取麦克风权限',
              content: (
                <>
                  <div>请检查微信麦克风权限已打开,或本功能不支持当前操作系统版本</div>
                  <div className="I-know" onClick={() => modeal.destroy()}>
                    我知道了
                  </div>
                </>
              ),
              okText: '确认',
              className: 'get-mircorphone-modal',
              maskClosable: true,
              centered: true,
              closeIcon: <iconpark-icon name="guanbiduihuakuang" size={'20px'}></iconpark-icon>
            })
          }
        })
    },
    clickToClose: () => {
      if (loadingVideoRef?.current) {
        // loadingVideoRef.current?.wantPause?.()
      }
      if (loadingAudio?.current) {
        audioHandle.stopAudio()
      }
      if (state.holdOn) return
      setState({
        holdOn: true,
        isThinking: false
      })
      clearTimeout(getConfigRef.current)
      handle.cutLine()
      // 清除内存中收集的全局视频
      VideoManagerRef.current?.clearGlobal()
      if (isMini.current) {
        sourceRef.current?.cancel?.('用户主动断开')
        return (window as any).wx?.miniProgram?.navigateBack?.()
      } else {
        sourceRef.current?.cancel?.('用户主动断开')
      }
    },
    setMode: (mode: 'work' | 'fun' | 'big') => {
      if (cache.current.connect) return
      cache.current.connect = true
      setTimeout(() => {
        cache.current.connect = false
      }, 2000)
      setState({ mode, showModeMask: false })
      if (mode !== state.mode) {
        sendMessage('break', 'break')
        getWelcome(mode)
        cache.current.controller.stopHandleRecognitionResult?.()
      }
    },
    clickChangeMode: () => {
      setState({ showModeMask: !state.showModeMask })
    },
    mousedown: () => {
      testTimer.current = setTimeout(() => {
        setState({
          test: !state.test
        })
      }, 5000)
    },
    mouseUp: () => {
      clearTimeout(testTimer.current)
    },
    // todo 获取热词，保留
    hotQuestion: async (e: any, hotQuestion: string) => {
      e.stopPropagation()
      // if (state.speaking) {
      //   message.warning({
      //     content: state.cardInfo.name + '正在讲话，请稍后再点击哦～',
      //     key: 'toast',
      //     className: styles['rtc_toast'],
      //     icon: <></>
      //   })
      //   return
      // }

      // 1. 打断数字人
      sendMessage('break', 'break')

      cache.current.controller?.stopHandleRecognitionResult?.()
      handleDo()
      clearMakeShowpreAns()
      clear()

      // 2. 清空上一轮次的所有素材 & 字幕
      setState({
        asring: false,
        preQue: hotQuestion,
        speaking: true,
        checked: true,
        preAns: '',
        chunkAns: '',
        displayAudio: {},
        displayVideo: [],
        displayImages: [],
        displayTexts: [],
        emoje: '',
        bigBrainImg: ''
      })
      // 3. 清空表情雨
      setRains([])

      stopIdlingTimer()
      await getChatAnswer(hotQuestion)
      firstFrameTime.current = new Date().getTime()
      textRef.current = ''
    },
    // 收集全局视频
    collectGlobalVideo: (video: HTMLVideoElement) => {
      VideoManagerRef.current.addVideo(video, true)
    },
    // 收集轮次内视频
    collectVideo: (video: HTMLVideoElement) => {
      VideoManagerRef.current.addVideo(video)
    },
    // 开始拾音
    handleStartRecognition() {
      // 1. 检测是否可以打断数字人进行拾音， 不能打断弹toast， 能的话进入下一步
      if (noBreakRef.current) {
        message.warning({
          content: '我正在思考哦，稍等一会儿',
          key: 'toast',
          className: styles['rtc_toast'],
          icon: <></>
        })
        return
      }

      // 2. 中断数字人播报， 中断本轮次音视频的播放、 中断全局音视频的播放，并收集正在播放中的音视频， 方便后续继续播放
      // 2.1 中断数字人播报
      sendMessage('break', 'break')
      // 2.2 中断本轮次音视频的播放
      VideoManagerRef.current.pauseAllVideos()
      // 2.3 中断全局音视频的播放
      VideoManagerRef.current.pauseGlobalVideos()

      // 3. 打开收音组件
      setState({
        isRecorderOpen: true
      })

      // 4. 开启拾音
      cache.current.controller?.startHandleRecognitionResult?.({
        engine_model_type: state?.selectLanguage?.webAsrParam,
        asrHotWords: state?.asrHotWords,
        asrHotWordTableId: state?.asrHotWordTableId
      })

      // 之前一句话开始的时候的逻辑
      handleDo()
      setState({
        asring: true,
        preQue: ''
      })
      waitTextRef.current = ''
      //打断数字人状态
      speakRef.current = false
    },
    // 取消拾音
    handleCancelRecognition() {
      // 1. 取消拾音
      cache.current.controller?.stopHandleRecognitionResult?.()
      // 之前的逻辑
      handleDo()
      clearMakeShowpreAns()
      clear()
      // 2. 恢复轮次音视频的播放 & 全局视频的播放
      VideoManagerRef.current.resumeAllVideos()
      VideoManagerRef.current.resumeGlobalVideos()

      // 3. 关闭收音组件
      setState({
        isRecorderOpen: false,
        preQue: ''
      })

      // 4. 可以再次打断
      noBreakRef.current = false

      // 5. 清空之前的文案
      textRef.current = ''
    },
    // 发送识别文案
    async handleConfirmRecognition(text: string) {
      const newText = asrEndingPunctuation(text)
      // 发送识别文案后不可打断， 需要等到收到数字人播报第一帧后才可以再次打断
      setState((pre) => ({
        preQue: newText,
        liveRoomChatList: getLiveRoomChatAsr(pre.liveRoomChatList, newText)
      }))
      console.log('====================================')
      console.log('识别结果', text)
      // V3.0.3新增对话时上报，现阶段只上报对话当前模式
      eventTracking.track({
        data: {
          eventName: ETrackingEventName.sessionSendingMessage,
          eventValue: JSON.stringify({
            speakMode: state.speakMode
          })
        }
      })
      console.log('====================================')

      // 清除本轮次的Video
      VideoManagerRef.current.clear()

      if (
        statusRef.current === 'recording' ||
        statusRef.current === 'recognizing' ||
        statusRef.current === 'continuing'
      ) {
        cache.current.controller?.stopHandleRecognitionResult?.()
        handleDo()
        clearMakeShowpreAns()
        clear()
        if (text) {
          noBreakRef.current = true
          await getChatAnswer(text)
        } else {
          noBreakRef.current = false
          message.warning({
            content: '我没有听清哦，请重试',
            key: 'toast',
            className: styles['rtc_toast'],
            icon: <></>
          })
        }
        // 清空素材
        setState({
          // preQue: '',
          preAns: '',
          chunkAns: '',
          isRecorderOpen: false,
          displayAudio: {},
          displayVideo: [],
          displayImages: [],
          displayTexts: [],
          emoje: '',
          bigBrainImg: '',
          products: null,
          isThinking: !!text
        })
        // 清空表情雨
        setRains([])
        textRef.current = ''
        firstFrameTime.current = new Date().getTime()
      }
    },
    // 切换字幕开关方法
    switchSubtitles() {
      message.warning({
        content: state.subtitlesIsShow ? '字幕已关闭' : '字幕已打开',
        key: 'toast',
        className: styles['rtc_toast'],
        icon: <></>
      })
      setState({
        subtitlesIsShow: !state.subtitlesIsShow
      })
    },
    // 切换模式开关方法
    switchSpeakMode(mode: speakModeEnum) {
      message.warning({
        content:
          state.speakMode === speakModeEnum.QUIET
            ? '已切换为嘈杂模式，请点击按钮讲话哦'
            : '已切换为安静模式，可以直接和数字员工讲话哦',
        key: 'toast',
        className: styles['rtc_toast_speakMode'],
        icon: <></>
      })
      //清空之前的文案
      textRef.current = ''
      setState({
        speakMode: mode
      })
      speakModeRef.current = mode
      // 切换模式，嘈杂模式暂停拾音
      if (mode === speakModeEnum.NOISY) {
        cache.current?.controller?.stopHandleRecognitionResult?.()
      } else {
        // 安静模式开始拾音
        handle.quietModeOpenAdapterization()
      }
    },
    //切换安静模式下后开启拾音
    quietModeOpenAdapterization() {
      if (speakModeRef.current === speakModeEnum.NOISY) return
      cache.current.controller?.startHandleRecognitionResult?.({
        engine_model_type: state?.selectLanguage?.webAsrParam,
        asrHotWords: state?.asrHotWords,
        asrHotWordTableId: state?.asrHotWordTableId
      })
      // 之前一句话开始的时候的逻辑
      handleDo()
      setState({
        asring: true,
        preQue: ''
      })
      waitTextRef.current = ''
    },
    //安静模式下打断数字人行为
    quietModeBreak() {
      //打断数字人
      sendMessage('break', 'break')
      // 更新speaking
      setState({
        speaking: false
      })
      //打断数字人后，恢复轮次音视频的播放 & 全局视频的播放
      console.log('quietModeBreak')
      //中断本轮次音视频的播放
      VideoManagerRef.current.pauseAllVideos()
      //中断全局音视频的播放
      VideoManagerRef.current.pauseGlobalVideos()
      // 再次开启拾音
      handle.quietModeOpenAdapterization()
      // 打断
      speakRef.current = false
    },
    // 监听视频播放 开始
    onVideoStart: throttle(
      () => {
        setState({
          vodeoPlaying: true
        })
        if (state.speakMode === speakModeEnum.QUIET) {
          // 如果是安静模式下被点开的视频，那么需要打断拾音
          cache.current?.controller?.stopHandleRecognitionResult?.()
        }
        // 如果播放视频，那么就中断定时
        stopInterval()
      },
      600,
      { leading: true }
    ),
    // 监听视频播放 结束
    onAllVideosEnd: throttle(
      () => {
        setState({
          vodeoPlaying: false
        })
        if (state.speakMode === speakModeEnum.QUIET) {
          // 如果是安静模式下视频都结束了 开启拾音
          handle.quietModeOpenAdapterization()
        }
        // 视频暂停后，开启定时
        handleDo()
      },
      600,
      { leading: true }
    ),
    // 点击语言选项
    onClickLanguage: () => {
      setState({
        languageDrawer: true
      })
    }
  }

  //获取门票
  const getTicket = async () => {
    return getChatTicket(params.project)
      .then(async (res) => {
        ticket.current = res
        await checkList()
      })
      .catch((e) => {
        const timer = setTimeout(() => {
          getTicket()
          clearTimeout(timer)
        }, 1000)
        sentry.report?.error(
          {
            module: EReportModule.Rtc,
            keyword: '小程序获取门票失败'
          },
          e
        )
      })
  }

  //查询队列
  const checkList = async () => {
    checkWaitList(params.project, ticket.current)
      .then((res) => {
        if (res.timeout) {
          const timer = setTimeout(() => {
            getTicket()
            clearTimeout(timer)
          }, 1000)
          return
        }
        if (!res?.block) {
          setTimeout(() => {
            setState({
              holdOn: false,
              waitOrStart: 'start'
            })
          }, 1000)
          try {
            if (loadingAudio.current && loadingAudio.current?.paused) {
              audioHandle.playAudio()
            }
          } catch {
            console.log('播放失败')
          }
          handle.joinChannle()
          beginStart()
        } else {
          setTimeout(() => {
            setState({
              holdOn: false,
              waitOrStart: 'wait'
            })
          }, 1000)
          try {
            if (loadingAudio.current && loadingAudio.current?.paused) {
              audioHandle.playAudio()
            }
          } catch {
            console.log('播放失败')
          }
          const timer = setTimeout(() => {
            checkList()
            clearTimeout(timer)
          }, 5000)
          setState({
            ticketInfo: res
          })
        }
      })
      .catch((e) => {
        const timer = setTimeout(() => {
          checkList()
          clearTimeout(timer)
        }, 1000)
        sentry.report?.error(
          {
            module: EReportModule.Rtc,
            keyword: '小程序查询等待队列失败'
          },
          e
        )
      })
  }

  /**
   * 获取对话答案
   */
  const getChatAnswer = async (text: string, event?: string) => {
    // 改造新增每轮对话 重置sessionId
    sessionIdRef.current = uuid4()
    getNewAnswer({ text, sessionId: sessionIdRef.current, event })
  }

  const onSubscribe = (
    ans: { text: string; id: string },
    traceId: string,
    res: IAnswer,
    sessionId: string,
    first = false
  ) => {
    //这个时候 加上First 模式。
    const transmitUUID = uuid4()
    const { queryId = '' } = res
    if (first && ans.text) {
      // 这里用一个map存储首此返回的时间
      firstReplyFrameTimeMap.current.set(ans.id, new Date().getTime())
    }
    //获取结束
    if (res?.state === 2) {
      guideController.closeGuide()
      const { sessionEnd, emotionPackUrl = '', emotionType = 0, from, products, replyImages, replyText = '' } = res
      setState((pre) => ({
        products: products?.[0],
        bigBrainImg: replyImages?.[0],
        liveRoomChatList: replyImages?.[0]
          ? [...pre.liveRoomChatList, { type: LiveRoomDialogType.BIGBRAINIMG, content: replyImages?.[0] }]
          : [...pre.liveRoomChatList]
      }))
      console.log('====================================')
      console.log(
        'sessionEnd',
        sessionEnd,
        'sessionId',
        sessionId,
        'sessionIdRef.current',
        sessionIdRef.current,
        'from',
        from,
        'ans',
        ans,
        'speakRef.current',
        speakRef.current,
        'ans.id',
        ans.id
      )
      if (sessionId?.endsWith('welcome')) {
        if (!replyText) {
          //开始被动拾音
          handle.quietModeOpenAdapterization()
          // cache.current?.controller?.startHandleRecognitionResult?.()
          setState({ asring: true, checked: false })
          noBreakRef.current = false
          return
        } else {
          setState((pre) => ({
            emoje: emotionPackUrl,
            emojiType: emotionType,
            liveRoomChatList:
              emotionType === 0 && emotionPackUrl
                ? [...pre.liveRoomChatList, { type: LiveRoomDialogType.EMOJI, content: emotionPackUrl }]
                : [...pre.liveRoomChatList]
          }))
          if (emotionType === 1) startRains()
          isMini.current &&
            emotionPackUrl &&
            saveLog(
              params.project,
              sessionIdRef.current,
              JSON.stringify({
                canvasData: { emoji: [{ mediaUrl: emotionPackUrl }], emotionType: emotionType }
              }),
              1,
              false,
              dialogueId.current,
              2
            ).catch((e) => {
              sentry.report?.error(
                {
                  module: EReportModule.Rtc,
                  keyword: '保存日志失败'
                },
                e
              )
            })
        }
        welcomeRef.current = ans.text
        lastText.current = ans.text
        return humanSpeak({
          payload: checkIsJSON(replyText) ? JSON.parse(replyText) : replyText,
          que: '',
          first: true,
          id: transmitUUID,
          wait: true,
          queryId: ans.id,
          chunk: ans.text
        })
      } else {
        lastText.current = ans.text
        isMini.current &&
          rtcReport({
            userId: new URLSearchParams(window.location.search)?.get('userId') || algUserIdRef.current,
            event: {
              eventValue: JSON.stringify({
                isSuccess: true,
                content: ans.text,
                time: new Date().getTime(),
                action: 'success',
                eventName: 'onePhoneTalk',
                companyId: state.companyId
              }),
              eventTimestamp: new Date().getTime()
            }
          })
        return humanSpeak({
          payload: checkIsJSON(replyText) ? JSON.parse(replyText) : replyText,
          que: res.requestText,
          first: false,
          id: transmitUUID,
          wait: true,
          queryId: ans.id,
          chunk: ans.text
        })
      }

      //失败
    } else if (res.state === 3) {
      console.log('超时')
      guideController.closeGuide()
      //获取下一句
    } else {
      dialogRef.current?.subscribeText(traceId, onSubscribe)
      const { replyText = '', emotionPackUrl = '', emotionType = 0 } = res
      if (first) {
        setState((pre) => ({
          emoje: emotionPackUrl,
          emojiType: emotionType,
          liveRoomChatList:
            emotionType === 0 && emotionPackUrl
              ? [...pre.liveRoomChatList, { type: LiveRoomDialogType.EMOJI, content: emotionPackUrl }]
              : [...pre.liveRoomChatList]
        }))
        isMini.current &&
          emotionPackUrl &&
          saveLog(
            params.project,
            sessionIdRef.current,
            JSON.stringify({
              canvasData: { emoji: [{ mediaUrl: emotionPackUrl }], emotionType: emotionType }
            }),
            1,
            false,
            dialogueId.current,
            2
          ).catch((e) => {
            sentry.report?.error(
              {
                module: EReportModule.Rtc,
                keyword: '保存日志失败'
              },
              e
            )
          })
        if (emotionType) startRains()
        dialogRef.current?.traceDialog(sessionId)
        return humanSpeak({
          payload: checkIsJSON(replyText) ? JSON.parse(replyText) : replyText,
          que: res.requestText,
          first: false,
          id: transmitUUID + 'trace',
          wait: true,
          queryId: ans.id,
          chunk: ans.text
        })
      } else {
        return humanSpeak({
          payload: checkIsJSON(replyText) ? JSON.parse(replyText) : replyText,
          que: res.requestText,
          first: false,
          id: transmitUUID,
          wait: true,
          queryId: ans.id,
          chunk: ans.text
        })
      }
    }
  }

  const getNewAnswer = async (payload: { text: any; sessionId: any; event?: any }) => {
    const { text, sessionId, event } = payload
    const webStaffText = configTextStore.customizeText.webStaffText || '数字员工'
    endToEndTimeMap.current.set(sessionId, new Date().getTime())
    frameTimeLogList.current.push({
      type: 'query',
      content: text,
      sessionId: sessionId,
      current_time: new Date().getTime()
    })
    const { traceId, dialog } = await streamController.ask(sessionId, text, dialogueId.current, event)
    console.log('ask:', traceId, dialog)
    if (traceId == LACK_RIGHTS_DATA_CODE) {
      if (isMini.current) {
        message.warning({
          content: webStaffText + '已下线',
          key: 'toast',
          className: styles['rtc_toast'],
          icon: <></>
        })
      } else {
        // message.warning(dialog?.message)
      }
    } else {
      if (traceId && dialog) {
        dialog?.subscribeText(traceId, onSubscribe, () => {}, true)
      } else {
        setState({
          checked: false
        })
        console.log('====================================')
        console.log(dialog)
        console.log('====================================')
        sentry?.report?.error(
          {
            module: EReportModule.Rtc,
            keyword: '获取对话答案失败'
          },
          dialog
        )
      }
      //获取答案
      streamController.get(traceId)
    }
  }

  const getWelcome = async (mode?: 'work' | 'fun' | 'big') => {
    sessionIdRef.current = uuid4() + 'welcome'
    await getNewAnswer({ text: '', sessionId: sessionIdRef.current, event: 'welcome' })
  }

  const humanSpeak = ({
    payload,
    que,
    first,
    id,
    wait,
    queryId,
    chunk
  }: {
    payload: any
    que?: string
    first?: boolean
    id?: string
    wait?: boolean
    queryId?: string
    chunk: string
  }) => {
    setState({ animationState: animationStateEnum.INPUT })
    if (!payload || !chunk) return
    const { canvasData = {}, text = '', type } = payload
    if (type === 'noMatchResponse' && speakRef.current) {
      return
    }
    const { displayImages = [], displayTexts = [], displayVideos = [], backgroundMusic = {} } = canvasData
    displayImageRef.current = displayImages
    displayTextRef.current = displayTexts
    displayVideoRef.current = displayVideos
    backgroundMusicRef.current = backgroundMusic
    welcomeMesID.current = welcomeRef.current ? uuid4() : undefined
    const answer = chunk
    sendMessage(answer, 'answer', wait, id ? id : welcomeMesID.current ? welcomeMesID.current : undefined, queryId)
    que && state.chatList.unshift({ type: 'que', label: que })
    state.chatList.unshift({ type: 'ans', label: chunk })
    setState({ chatList: [...state.chatList], preQue: asrEndingPunctuation(que) })
    return chunk
  }

  const sendMessage = (
    text: string,
    type: 'answer' | 'heartbeat' | 'break',
    wait?: boolean,
    id?: string,
    queryId?: string
  ) => {
    communication.current = uuid4()
    // if (noBreakRef.current && id != welcomeMesID.current && type !== 'heartbeat') return
    let firstSend = 0
    let socketId = ''
    let socketFragmentId = ''
    let messageLanguage = ''
    
    if (type === 'answer') {
      firstSend = 2
      const mapTime = firstReplyFrameTimeMap.current.get(queryId)
      if (mapTime) {
        firstSend = 1
      }
      socketId = sessionIdRef.current ? sessionIdRef.current : communication.current
      socketFragmentId = queryId || ''
      // 使用languageRef获取最新的语言值（brainCode）
      messageLanguage = languageRef.current || ''
      // 如果发消息，就暂停计时
      stopIdlingTimer()
    }
    if (type === 'break') {
      socketId = communication.current
      traceIdRef.current = ''
    }
    cacheLog.current.set(sessionIdRef.current ? sessionIdRef.current : communication.current, text)
    if (type !== 'heartbeat') {
      frameTimeLogList.current.push({
        type,
        content: text,
        sessionId: socketId,
        fragment_id: socketFragmentId,
        current_time: new Date().getTime(),
        wait: wait ? true : false
      })
    }
    
    // 构建WebSocket消息
    const message: any = { 
      id: socketId, 
      type, 
      text, 
      wait: wait ? true : false, 
      firstSend, 
      fragmentId: socketFragmentId 
    }
    
    // 当type为answer时，添加language字段
    if (type === 'answer' && messageLanguage) {
      message.language = messageLanguage
    }
    
    cache.current.webSorcket?.send(JSON.stringify(message))
  }

  const currentEndTime = useRef(0)
  const resolveRef = useRef<any>(null)
  const rejectRef = useRef<any>(null)
  const videoPlayRef = useRef<any>(null)
  const endPlay = (e: any) => {
    currentEndTime.current++
    if (state.displayVideo.length === currentEndTime.current) {
      resolveRef.current?.(e)
      clearInterval(videoPlayRef.current)
    }
  }
  const clear = () => {
    window.removeEventListener('video-end', endPlay)
    rejectRef?.current?.()
    clearInterval(videoPlayRef.current)
  }

  const output = useRef<any>(0)
  const pretimer = useRef<any>(0)
  const bigModeResolveRef = useRef<any>(null)
  const makeShowpreAns = (preAns: string) => {
    if (pretimer.current) clearInterval(pretimer.current)
    return new Promise((resolve, reject) => {
      bigModeResolveRef.current = resolve
      pretimer.current = setInterval(() => {
        const res = preAns.slice(output.current, output.current + 1)
        if (output.current % 30 === 0) handleDo()
        output.current += 1
        if (output.current >= preAns.length) {
          bigModeResolveRef.current?.()
          bigModeResolveRef.current = () => {}
          clearInterval(pretimer.current)
        }
        setState((pre) => ({ showpreAns: pre.showpreAns + res }))
      }, 1000 / 12)
    })
  }

  const clearMakeShowpreAns = () => {
    clearInterval(pretimer.current)
    bigModeResolveRef.current?.()
    bigModeResolveRef.current = () => {}
    output.current = 0
    setState({ showpreAns: '' })
    waitTextRef.current = ''
  }

  const scrollIntoBottom = (className: string) => {
    const div = document.querySelector(className)
    if (div) {
      div.scrollTop = div?.scrollHeight - div.clientHeight
    }
  }

  const reset = () => {
    setState({
      chatList: []
    })
  }

  return {
    humanRef,
    state,
    setState,
    humanInstanse,
    reset,
    inputRef,
    handle,
    isMini,
    waitTextRef,
    loadingVideoRef,
    bgVideoRef,
    traceId: traceIdRef.current,
    taskId: taskIdRef.current,
    userId: new URLSearchParams(window.location.search)?.get('userId') || ''
  }
}

export default SDKEffects
