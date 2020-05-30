# tms-koa-jimp

tms-koa 插件，实现通过 Web API 操作 jimp，处理图片。

已支持的功能：

- 给图片添加文字水印。

使用的环境的变量。

| 环境变量                    | 说明                                                           | 默认值                  |
| --------------------------- | -------------------------------------------------------------- | ----------------------- |
| TMS_KOA_JIMP_FONT_PATH      | 文字水印使用的字库位置。                                       | Jimp.FONT_SANS_32_BLACK |
| TMS_KOA_JIMP_FONT_SIZE      | 字库文字的大小。                                               | 32                      |
| TMS_KOA_JIMP_SAVE_FS_DOMAIN | 用于保存处理过的文件的域。需要在`config/fs.js`中有相应的配置。 | 无                      |

# 关于字库

`Jimp`只包含英文字库，如果需要添加中文水印，就必须提供中文字库。

`Jimp`只支持`fnt`（bitmap font）格式的字库，通常需要自己制作。在 windows 环境上，用`BMfont`可以将`ttf`字库转换为`fnt`格式。

转化时，建议将字库设置为黑色透明背景。在`Font settings`中设置字体的尺寸为 32，在`Export options`中`Bit depth`设置为 32，在`Presets`中选择`Black text with alpha`，`Textures`设置为`png - Portable Network Graphics`。

参考：http://www.angelcode.com/products/bmfont/

# 运行 demo

在 demo 目录下新建 files/upload 目录，在目录下放置要加水印的图片。

在 demo 目录下执行：

> node server.js

在浏览器中打开：`http://localhost:3000/text.html`，填入相应的参数。

# API

| 接口名称              | 接口功能         |
| --------------------- | ---------------- |
| /image/watermark/text | 添加文字水印接口 |

## 文字水印

| 描述     | 定义             |
| -------- | ---------------- |
| 接口名   | /watermark/text  |
| 请求方式 | POST             |
| 请求格式 | application/json |

### URL 参数

| 参数名称 | 类型   | 必选 | 描述                                      |
| -------- | ------ | ---- | ----------------------------------------- |
| image    | String | 是   | 要添加水印的图片。参考`tms-koa`文件服务。 |
| save     | String | 否   | 如果等于“Y”，将结果保存在服务器上。       |

### POST 参数

| 参数名称 | 类型   | 必选 | 描述                                                                               |
| -------- | ------ | ---- | ---------------------------------------------------------------------------------- |
| text     | String | 是   |                                                                                    |
| x        | Number | 否   | 横轴边距，单位:像素(px)，默认值为 0。                                              |
| y        | Number | 否   | 纵轴边距，单位:像素(px)，默认值为 0。                                              |
| color    | String | 否   | css 格式颜色，例如：#FF00FF。                                                      |
| bgColor  | String | 否   | css 格式颜色，例如：#FF00FF。                                                      |
| width    | Number | 否   | 文字背景宽度，单位:像素(px)，默认文字实际宽度加 2 个像素。只有设置了背景色才生效。 |
| fontSize | Number | 否   | 文字尺寸。不指定，或小于等于 0，使用环境变量`TMS_KOA_JIMP_FONT_SIZE`的值。         |
| align    | String | 否   | 文字在背景中的水平对齐方式，可选：left,center,right。默认：left。                  |

### 返回结果

如果选择保存文件，返回文件路径，否则为 base64 格式的图片数据。

| 参数名称   | 类型   | 描述                                                                                                                |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| path       | String | 生成的文件在文件域中的存储路径。用于后续对文件的操作，例如：设置业务信息，删除文件等。可参见`tms-koa`中的文件服务。 |
| publicPath | String | 可通过服务器访问的文件地址。                                                                                        |

## 示例

```
curl -X POST -H "Content-type: application/json" "http://localhost:3000/image/watermark/text?image=white.png&save=Y" -d '[{"text":"你好","x":10,"y":10,"color":"#ff0000","bgColor":"#00ff00","width":100,"fontSize":32,"align":"center"}]'
```

```
{"msg":{"path":"/202005/3012/59431028.png","publicPath":"/output/202005/3012/59431028.png"},"code":10001}
```
