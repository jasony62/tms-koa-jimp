const { ResultData, ResultFault } = require('tms-koa')
const { BaseCtrl } = require('tms-koa/lib/controller/fs/base')
const { LocalFS } = require('tms-koa/lib/model/fs/local')

const newTextWatermark = require('../helper/watermark').newTextWatermark

class Main extends BaseCtrl {
  constructor(...args) {
    super(...args)
  }
  /**
   * 添加文字水印
   */
  async text() {
    const { image, save } = this.request.query

    const localFS = new LocalFS(this.domain, this.bucket)

    if (!image || !localFS.existsSync(image))
      return new ResultFault('指定的文件不存在')

    const fullpath = localFS.fullpath(image)

    const textWatermark = await newTextWatermark(fullpath)

    /* 保存结果 */
    if (save === 'Y')
      if (!textWatermark.saver.available)
        return new ResultFault(textWatermark.saver.fault)

    const watermarks = this.request.body
    watermarks.forEach(
      ({ text, x, y, color, bgColor, width, fontSize, align }) => {
        if (typeof text === 'string')
          textWatermark.addText(
            text,
            x,
            y,
            color,
            bgColor,
            width,
            fontSize,
            align
          )
      }
    )

    /* 保存结果 */
    if (save === 'Y') {
      const path = await textWatermark.save(this.bucket)
      return new ResultData(path)
    } else {
      const result = await textWatermark.getBase64Async()
      return new ResultData(result)
    }
  }
}

module.exports = Main
