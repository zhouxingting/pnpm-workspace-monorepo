/**
 * 第一步：梳理需求
 * =====不能为======
 * null
 * undefinend
 * 不能是非string类型
 * 不能/开头
 * 不能_开头
 * 前后不能有空格
 * 不能在黑名单内【node_moudules，favicon.ico】
 * 不能是node核心内置模块的名称-用{builtins}包进行判断
 * 名称长度不能超过214
 * 不能包含大写字母
 * 不能包含/[~'!()*]/等字符
 */

var scopedPackagePattern = new RegExp("^(?:@([^/]+?)[/])?([^/]+?)$");
var builtins = require("builtins");
var blacklist = ["node_modules", "favicon.ico"];

function validate(name) {
  var warnings = [];
  var errors = [];

  /** 不能为null */
  if (name === null) {
    errors.push("不能为null");
  }

  /** 不能为undefined */
  if (name === undefined) {
    errors.push("不能为undefined");
  }

  if (typeof name !== "string") {
    errors.push("不能是非string类型");
  }

  if (/^\./.test(name)) {
    errors.push("不能 . 开头");
  }

  if (/^_/.test(name)) {
    errors.push("不能 _ 开头");
  }

  /** 前后不能有空格 */
  if (name.trim() !== name) {
    warnings.push("前后不能有空格");
  }

  /** 不能是node核心内置模块的名称 */
  if (
    builtins({ version: "*" }).forEach((element) => {
      if (element === name) {
        warnings.push("不能是node核心模块");
      }
    })
  );

  /** 不能包含大写字母 */
  if (name.toLocaleLowerCase() !== name) {
    warnings.push("不能包含大写字母");
  }

  /** 不能包含/[~'!()*]/等字符 */
  if (/[~'!()*]/.test(name.split("/").slice(-1)[0])) {
    warnings.push('不能包含以下字符 - ("~\'!()*")');
  }

  /** 长度不能超过214 */
  if (name.length > 214) {
    warnings.push("长度不能超过214");
  }

  /** 判断是否是正确的-包含组织名称-的包 */
  if (encodeURIComponent(name) !== name) {
    var nameMatch = name.match(scopedPackagePattern);
    if (nameMatch) {
      var user = nameMatch[1];
      var pkg = nameMatch[2];
      if (
        encodeURIComponent(user) === user &&
        encodeURIComponent(pkg) === pkg
      ) {
        done(errors, warnings);
      }
    }
  }

  return done(errors, warnings);
}

function done(errors, warnings) {
  var resultes = {
    validForNewPackages: !errors.length && !warnings.length,
    validForOldPackages: !warnings.length,
    warnings: warnings,
    errors: errors,
  };

  if (!resultes.errors.length) {
    delete resultes.errors;
  }

  if (!resultes.warnings.length) {
    delete resultes.warnings;
  }

  return resultes;
}

module.exports = validate;
