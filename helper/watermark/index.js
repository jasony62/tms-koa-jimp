const { LocalFS } = require('tms-koa/lib/model/fs/local')
const { UploadImage } = require('tms-koa/lib/model/fs/upload')
const FsContext = require('tms-koa/lib/context/fs').Context

const Jimp = require('jimp')

const FONT_PATH = process.env.TMS_KOA_JIMP_FONT_PATH || Jimp.FONT_SANS_32_BLACK

const FONT_SIZE = process.env.TMS_KOA_JIMP_FONT_SIZE || 32

const SAVE_FS_DOMAIN = process.env.TMS_KOA_JIMP_SAVE_FS_DOMAIN

class Saver {
  constructor() {
    this.available = false

    if (!SAVE_FS_DOMAIN)
      this.fault = '没有指定保存处理结果文件的域[TMS_KOA_JIMP_SAVE_FS_DOMAIN]'

    const fsContext = FsContext.insSync()
    const fsDomain = fsContext.getDomain(SAVE_FS_DOMAIN)
    if (!fsDomain)
      this.fault = `指定保存处理结果文件的域[${SAVE_FS_DOMAIN}]不可用`

    this.domain = fsDomain
    this.available = true
  }
  save(bucket, data) {
    const saveFs = new LocalFS(this.domain, bucket)
    const uploader = new UploadImage(saveFs)
    const fullpath = uploader.storeBase64(data)
    const relativePath = saveFs.relativePath(fullpath)
    const publicPath = saveFs.publicPath(fullpath)

    return { path: relativePath, publicPath }
  }
}

class TextWatermark {
  constructor(image, font, fontSize) {
    this.image = image
    this.font = font
    this.fontSize = fontSize
    this.saver = new Saver()
  }
  /**
   *
   * @param {*} text
   * @param {*} x
   * @param {*} y
   * @param {*} color
   * @param {*} bgColor
   * @param {*} width
   * @param {*} fontSize
   * @param {*} align
   */
  addText(text, x, y, color, bgColor, width, fontSize, align) {
    // 大小和位置
    let textRawWidth = Jimp.measureText(this.font, text) + 2
    x = parseInt(x)
    y = parseInt(y)
    let bgWidth = parseInt(width) // 背景宽度
    let textSize = parseInt(fontSize) > 0 ? parseInt(fontSize) : this.fontSize
    let textScale = textSize / this.fontSize
    // 颜色
    let textRGB = color ? Jimp.intToRGBA(Jimp.cssColorToHex(color)) : null
    let textBgHex = bgColor ? Jimp.cssColorToHex(bgColor) : null
    // 将文字放在透明的图片上
    let textImage = new Jimp(textRawWidth, this.fontSize + 2, 0x00000000)
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
  /**
   *
   */
  getBase64Async() {
    return this.image.getBase64Async(Jimp.AUTO)
  }
  /**
   *
   * @param {*} bucket
   */
  async save(bucket) {
    const result = await this.getBase64Async()

    const path = this.saver.save(bucket, result)

    return path
  }
}

module.exports.newTextWatermark = async function (imagePath) {
  const jimpImage = await Jimp.read(imagePath)

  const font = await Jimp.loadFont(FONT_PATH)

  const textWatermark = new TextWatermark(jimpImage, font, FONT_SIZE)

  return textWatermark
}
