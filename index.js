const { Ctrl, ResultData } = require('tms-koa')

class Main extends Ctrl {
  /**
   * 测试接口，返回版本信息
   */
  version() {
    let pkg = require(__dirname + '/package.json')
    return new ResultData(pkg.version)
  }
}

module.exports = Main
