const originData = {
  from: {}, // 未使用, 响应来源信息，包含音频流，视频流等信息
  topic: 'llm_response', // 使用
  // 使用，原始数据为ArrayBuffer格式
  payload: {
    session_id: '', // 使用
    // 使用，原始数据为string格式的json字符串
    response: {
      code: 200, // 使用
      message: null, // 使用
      logTraceId: 'cf643f061301246b', // 未使用，保留
      replyText: '', // 未使用，响应的文字片段，保留
      // 使用，文本，素材等数据，目前会作为originalAnswer返回给用户
      fatReply: {
        replyText: '', // 使用，回复的数据，但如果是开场白的话，这里面会包含素材数据
        plainText: '', // 暂未使用，如果是开场白的话，里面只有纯文本，没有素材，是否可以切换成这个数据
        extra: {}, // 使用，自定义信息
        payloads: {
          canvas: '', // 使用，会话相关的素材
        },
        // ...其余字段未使用
      },
    },
  },
};