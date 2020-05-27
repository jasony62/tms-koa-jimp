const { BaseCtrl } = require('tms-koa/lib/controller/fs/base')
const { LocalFS } = require('tms-koa/lib/model/fs/local')
const { ResultData, ResultFault } = require('tms-koa')
const Jimp = require('jimp')

const FONT_PATH = process.env.TMS_KOA_JIMP_FONT_PATH || Jimp.FONT_SANS_32_BLACK

const FONT_SIZE = process.env.TMS_KOA_JIMP_FONT_SIZE || 32

class TextWatermark {
  constructor(image, font) {
    this.image = image
    this.font = font
  }
  addText(text, x, y, color, bgColor, width, fontSize, align) {
    // 大小和位置
    let textRawWidth = Jimp.measureText(this.font, text) + 2
    x = parseInt(x)
    y = parseInt(y)
    let bgWidth = parseInt(width) // 背景宽度
    let textSize = parseInt(fontSize) > 0 ? parseInt(fontSize) : FONT_SIZE
    let textScale = textSize / FONT_SIZE
    // 颜色
    let textRGB = color ? Jimp.intToRGBA(Jimp.cssColorToHex(color)) : null
    let textBgHex = bgColor ? Jimp.cssColorToHex(bgColor) : null
    // 将文字放在透明的图片上
    let textImage = new Jimp(textRawWidth, FONT_SIZE + 2, 0x00000000)
    textImage.print(this.font, 1, 1, text)
    if (textRGB) {
      textImage.scan(0, 0, 100, 36, function (x, y, idx) {
        let bitmap = this.bitmap
        let red = bitmap.data[idx + 0]
        let green = bitmap.data[idx + 1]
        let blue = bitmap.data[idx + 2]
        let alpha = bitmap.data[idx + 3]
        if (x > 0 && y > 0 && x < bitmap.width && y < bitmap.height)
          if (red === 0 && green === 0 && blue === 0 && alpha > 0) {
            this.setPixelColor(
              Jimp.rgbaToInt(textRGB.r, textRGB.g, textRGB.b, alpha),
              x,
              y
            )
          }
      })
    }
    // 缩放
    if (textScale !== 1) textImage.scale(textScale)

    if (textBgHex) {
      /* 生成背景 */
      let textScaleWidth = textRawWidth * textScale
      bgWidth = bgWidth || textScaleWidth
      let bgImage = new Jimp(bgWidth, textSize + 2, textBgHex)
      let textX = 0
      switch (align) {
        case 'center':
          textX = parseInt((bgWidth - textScaleWidth) / 2)
          break
        case 'right':
          textX = parseInt(bgWidth - textScaleWidth)
          break
      }
      bgImage.composite(textImage, textX, 0)
      this.image.composite(bgImage, x, y)
    } else {
      this.image.composite(textImage, x, y)
    }
  }
}

class Main extends BaseCtrl {
  /**
   * 添加文字水印
   */
  async text() {
    const { image } = this.request.query

    const localFS = new LocalFS(this.domain, this.bucket)

    if (!image || !localFS.existsSync(image))
      return new ResultFault('指定的文件不存在')

    const watermarks = this.request.body

    const fullpath = localFS.fullpath(image)

    const font = await Jimp.loadFont(FONT_PATH)
    const jimpImage = await Jimp.read(fullpath)

    const textWatermark = new TextWatermark(jimpImage, font)

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

    const result = await jimpImage.getBase64Async(Jimp.AUTO)

    return new ResultData(result)
  }
}

module.exports = Main
