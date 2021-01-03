// ==UserScript==
// @name        keylol表情包插件
// @namespace   http://tampermonkey.net/
// @version     0.17
// @description Keylol论坛的外挂表情包插件
// @require     http://cdn.staticfile.org/jquery/3.1.1/jquery.min.js
// @include     http*://*keylol.com/*
// @author      FoxTaillll
// @run-at      document-end
// ==/UserScript==

"use strict";

/** 一个表情集合的类.初始化方式:
 *  name表示表情集合的名字,是一个字符串;
 *  srcList是图片链接列表;
 *  $Parent是一个$对象,表示该表情集应该显示在什么地方,一般是个div
 *  showDebug是一个布尔值,true的话显示大量debug信息.
 */
class FaceSet{

  /* 构造方法 */
  constructor(name,srcList,$Parent,showDebug){
    // 复制初始数据
    this._name = name;
    this._srcList = srcList.slice(0); // 复制
    this._$Parent = $Parent;
    this._showDebug = showDebug;

    // 生成_$Element对象需要的html字符串
    this._html = this._createHtml();
    // 生成的$对象,一个div,用于显示图片集合,初值为null,第一次调用时才生成
    this._$Element = null;
  }

  /* 显示debug用信息,参数可以多个,像console.log一样使用 */
  debugMsg(){
    if(this._showDebug) {
      console.log(...arguments);
    }
  }

  /* 获取名字 */
  getName(){
    return this._name;
  }

  /* 生成html用 */
  _createHtml(){
    var html = "<div>";
    for(var i = 0;i < this._srcList.length;i++){
      var src = this._srcList[i];
      html += `<img src=${src} style=height:50px></img>`;
    }
    html += "</div>";
    this.debugMsg(html);
    return html;
  }

  /* 在jaParent中显示图像. */
  show(){
    // 若尚未生成,先生成
    if(!this._$Element){
      this._$Element = $(this._html);
      this._$Parent.append(this._$Element);
    }
    // 显示
    this._$Element.css({'display':'block'});
  }

  /* 隐藏 */
  hide(){
     this._$Element.css({'display':'none'});
  }

}

/** setycyas自制的表情插件类.用于在任意textarea上方添加表情插件.初始化方法:
 * $textarea:需要使用插件的textarea,$对象;
 * faceTable:一个{},key为表情分类字符串,value是一个列表,列表内容为图片链接;
 * showDebug:布尔值,设定是否显示debug信息.
 * 构造方法不会加入表情包,必须执行main().
 */
class SetycyasFacePlugin {

  constructor($textarea,faceTable,showDebug,beforeElement) {
    //复制初始变量
    this._$textarea = $textarea;
    this._faceTable = faceTable;
    this._showDebug = showDebug;
    this._beforeElement = beforeElement;

    //设置菜单
    this._$menu = $("<div id=faceMenu></div>");
    this._$menu.css({
      "line-height":"30px",
    });
      if ($textarea.attr("id") == "postmessage") {
          this._$menu.css({
              "width":"600px"
          });
      }
      if (location.href.indexOf('keylol.com') != -1) {
          this._beforeElement.before(this._$menu);
      } else {
          this._$textarea.before(this._$menu);
      }
    //设置显示图片用的div
    this._$faceDiv = $("</div><div id=faceContent style=clear:both></div>");
    this._$faceDiv.css({
      "border":"1px solid rgb(131,148,150)",
      "margin-top":"5px",
      "padding":"10px"
    });
      if ($textarea.attr("id") == "postmessage") {
          this._$faceDiv.css({
              "width":"580px"
          });
      }
    this._$menu.after(this._$faceDiv);
    //FaceSet对象的表,key是FaceSet的name,同时也是this._$menu显示的内容;
    //value则是对应的FaceSet对象
    this._faceSetTable = {};
    //当前显示的表情集合
    this._curFaceSet = null;
  }

   /* 显示debug用信息,参数可以多个,像console.log一样使用 */
  debugMsg(){
    if(this._showDebug) {
      console.log(...arguments);
    }
  }

  //往textarea插入文本
  _insertText(textInsert){
    //用数组选择方法把$对象变成一般document对象,访问其光标选择位置
    var pos = this._$textarea[0].selectionEnd;
    // 原文本
    var oldText = this._$textarea.val();
    // 插入完成后的新文本
    var newText = oldText.substr(0,pos)+textInsert+oldText.substr(pos)
    // 插入
    this._$textarea.val(newText);
  }

  //初始化菜单与表情table
  _initMenuAndFaces(){
    //再写入菜单需要的html,记录表情集合对象
    var menuHtml = "";
    for(var menuKey in this._faceTable){
      var srcList = this._faceTable[menuKey];
      var objFs = new FaceSet(menuKey,srcList,this._$faceDiv,this._showDebug);
      menuHtml += `<div class=faceSetDiv><a class=faceSet>${menuKey}</a></div>`;
      this._faceSetTable[menuKey] = objFs;
    }
    this._$menu.html(menuHtml);
    $('.faceSet').css({
       "font-size":"12px","margin":"20px","color":"#f2f2f2","cursor":"pointer"
    });
    $('.faceSetDiv').hover(
      function(event){
        if(event.target.className != 'faceSetDiv') return;
        $(event.target).css({"background-color":"rgb(64,166,228)"});
      },
      function(event){
        if(event.target.className != 'faceSetDiv') return;
        $(event.target).css({"background-color":"rgb(64,166,228)"});
      }
    );
    $('.faceSetDiv').css({
      "min-width":"40px","float":"left","background-color":"rgb(64,166,228)"
    });
  }

  /* 绑定所有事件,需要冒泡执行 */
  _addEvents(){
    //添加事件时,需要传入自己,所以要记住自己
    var obj = this;
    //点击菜单,只有点击了'faceSet'class才生效
    var menu = this._$menu[0];
    menu.addEventListener('click',function(e){
      var target = e.target;
      if(target.className != 'faceSet'){
        return;
      }
      //点击的文字
      var faceTag = target.textContent;
      //如果当前没有已显示图像集,显示;
      if(!obj._curFaceSet){
        obj._curFaceSet = obj._faceSetTable[faceTag];
        obj._curFaceSet.show();
      }else{
      //若点击的文字不是当前显示的表情集合,把原来的表情集隐藏,显示点击的;
      //否则隐藏当前表情集合.
        if(obj._curFaceSet.getName() == faceTag){
          obj._curFaceSet.hide();
          obj._curFaceSet = null;
        }else{
          obj._curFaceSet.hide();
          obj._curFaceSet = obj._faceSetTable[faceTag];
          obj._curFaceSet.show();
        }
      }
    });
    //点击图片
    var faceDiv = this._$faceDiv[0];
    faceDiv.addEventListener('click',function(e){
      var target = e.target;
      // 点击的不是'img',忽略
      if(target.tagName.toLowerCase() != 'img'){
        return;
      }
      var src = target.src;
      var textInsert = `[img]${src}[/img]`;
      obj._insertText(textInsert);
    });
  }

  main(){
    //生成menu与表情集合的具体内容
    this._initMenuAndFaces();
    //绑定事件
    this._addEvents();
  }
}

function _init_scirpt($textarea, beforeElement) {
    if ($textarea.length == 0) {
        return;
    }

    //这一句自定义表情包,注意有些图片可能省略了域名
    var faceTable = {
        "阿鲁动图":[
            'https://blob.keylol.com/forum/202005/12/083257r2b1qbx96q463qee.gif',
            'https://blob.keylol.com/forum/202005/12/084847baa8zclm36288dmd.gif',
            'https://blob.keylol.com/forum/202005/12/085528vcdmiucvnwe1usig.gif',
            'https://blob.keylol.com/forum/202007/17/114656y33gjijzzr3t3q52.gif',
            'https://blob.keylol.com/forum/202007/17/122338s8q9hmq5qi89mmi9.gif',
        ],
        "鲁家拳法👊":[
            'https://blob.keylol.com/forum/202005/25/213106ezdy91o4vdlaov24.gif',
            'https://blob.keylol.com/forum/202005/25/213135kgwvv4gi4i62r2r4.gif',
            'https://blob.keylol.com/forum/202005/25/213106rzjyjy7zvcjokk7b.gif',
            'https://blob.keylol.com/forum/202005/25/213109ub20e07yg81utxjt.gif',
            'https://blob.keylol.com/forum/202006/05/213911vxmm0d0zz831dux1.gif',
            'https://blob.keylol.com/forum/202006/05/213914ympuapzaktup7hbt.gif',
        ],
        "鲁家剑法🗡":[
            'https://blob.keylol.com/forum/202005/25/224154e8rzq66kselrzqaq.gif',
            'https://blob.keylol.com/forum/202006/03/062937pgzj6b8hug85pdgj.gif',
            'https://blob.keylol.com/forum/202005/25/234755sohreyea435eze5e.gif',
            'https://blob.keylol.com/forum/202006/03/062937vvvszz5mstxmm7sm.gif',
            'https://blob.keylol.com/forum/202006/07/075622njydyj0knd0ow31z.gif',
        ],
        "崩坏3":[
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/102.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/101.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/100.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/99.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/98.jpg",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/97.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/96.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/95.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/94.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/93.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/92.jpg",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/91.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/90.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/89.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/88.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/87.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/86.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/85.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/84.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/83.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/82.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/81.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/80.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/79.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/78.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/77.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/76.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/75.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/74.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/73.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/72.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/71.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/70.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/69.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/68.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/67.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/66.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/65.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/64.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/63.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/62.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/61.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/60.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/59.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/58.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/57.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/56.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/55.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/54.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/53.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/52.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/51.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/50.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/49.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/48.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/47.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/46.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/45.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/44.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/43.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/42.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/41.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/40.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/39.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/38.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/37.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/36.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/35.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/34.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/33.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/32.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/31.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/30.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/29.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/28.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/27.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/26.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/25.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/24.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/23.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/22.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/21.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/20.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/19.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/18.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/17.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/16.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/15.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/14.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/13.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/12.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/11.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/10.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/9.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/8.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/7.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/6.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/5.gif",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/4.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/3.gif",
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/2.gif",
           "https://cdn.jsdelivr.net/gh/blogimg/emotion/HONKAI3/1.gif",
        ],
       "menhera":[
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_120.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_119.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_118.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_117.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_116.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_115.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_114.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_113.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_112.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_111.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_110.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_109.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_108.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_107.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_106.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_105.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_104.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_103.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_102.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_101.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_100.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_99.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_98.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_97.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_96.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_95.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_94.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_93.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_92.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_91.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_90.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_89.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_88.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_87.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_86.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_85.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_84.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_83.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_82.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_81.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_80.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_79.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_78.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_77.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_76.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_75.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_74.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_73.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_72.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_71.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_70.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_69.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_68.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_67.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_66.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_65.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_64.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_63.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_62.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_61.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_60.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_59.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_58.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_57.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_56.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_55.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_54.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_53.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_53(1).jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_52.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_51.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_50.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_49.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_48.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_47.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_46.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_45.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_44.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_43.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_42.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_41.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_40.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_39.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_38.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_37.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_36.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_35.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_34.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_33.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_32.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_31.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_30.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_29.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_28.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_27.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_26.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_25.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_24.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_23.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_22.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_21.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_20.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_19.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_18.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_17.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_16.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_15.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_14.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_13.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_12.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_11.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_10.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_9.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_8.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_7.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_6.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_5.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_4.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_3.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_2.jpg",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/menhera-chan/SR_1.jpg",
       ],
       "贴吧小表情":[
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/真棒.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/音乐.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/阴险.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/疑问.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/药丸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/呀咩爹.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/星星月亮.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/心碎.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/笑眼.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/笑尿.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/小红脸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/小乖.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/香蕉.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/犀利.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/捂嘴笑.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/委屈.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/挖鼻.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/吐舌.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/吐.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/太阳.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/太开心.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/酸爽.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/睡觉.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/手纸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/胜利.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/沙发.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/钱币.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/喷.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/怒.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/你懂的.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/勉强.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/玫瑰.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/礼物.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/泪.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/懒得理.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/蜡烛.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/狂汗.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/酷.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/惊讶.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/惊哭.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/滑稽.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/花心.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/红领巾.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/黑线.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/呵呵.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/汗.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/哈哈.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/乖.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/灯泡.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/蛋糕.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/大拇指.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/茶杯.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/彩虹.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/不高兴.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/便便.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/鄙视.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/爱心.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/啊.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/what.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/OK.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/tieba/haha.png",
       ],
       "泡泡":[
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/84.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/83.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/82.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/81.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/80.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/79.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/78.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/77.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/76.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/75.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/74.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/73.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/72.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/71.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/70.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/69.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/68.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/67.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/66.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/65.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/64.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/63.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/62.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/61.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/60.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/59.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/58.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/57.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/56.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/55.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/54.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/53.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/52.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/51.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/50.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/49.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/48.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/47.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/46.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/45.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/44.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/43.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/42.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/41.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/40.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/39.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/38.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/37.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/36.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/35.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/34.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/33.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/32.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/31.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/30.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/29.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/28.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/27.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/26.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/25.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/24.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/23.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/22.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/21.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/20.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/19.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/18.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/17.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/16.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/15.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/14.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/13.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/12.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/11.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/10.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/9.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/8.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/7.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/6.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/5.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/4.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/3.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/2.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/paopao/1.png",
       ],
       "请吃红小豆吧!":[
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_眨眼.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_一脸懵逼.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_耶耶耶.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_问号脸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_睡觉.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_受到惊吓.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_撒娇.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_哦.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_么么.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_略略略.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_哭唧唧.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_开心.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_嘿嘿嘿.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_喝水.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_好难.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_翻白眼.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_盯.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_倒地.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_吃包.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/请吃红小豆吧！_wow.png",
       ],
       "洛天依":[
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_阴阳先生.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_消灭你.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_掀桌.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_无言以对.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_去吧.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_前排.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_冷漠.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_可以.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_看透一切.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_滑稽.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_哈哈哈.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_打尻.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_吃药.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_吃包群众.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_傲娇.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_爱你哦.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/洛天依_？？？.png",
       ],
       "热词系列":[
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_“狼火”.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_知识增加.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_张三.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_有内味了.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_我裂开了.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_我哭了.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_问号.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_危.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_你细品.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_猛男必看.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_害.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_咕咕.jpg",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_递话筒.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_标准结局.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_爱了爱了.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_知识盲区.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_镇站之宝.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_真香.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_有生之年.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_爷关更.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_秀.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_下次一定.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_我太南了.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_我酸了.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_我全都要.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_完结撒花.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_神仙UP.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_三连.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_你币有了.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_妙啊.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_可以.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_高产.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_大师球.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_打卡.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_锤.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_吹爆.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_不愧是你.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_奥力给.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_AWSL.png",
         "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/热词系列_狼火.png",
       ],
       "TV":[
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_抓狂.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_皱眉.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_再见.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_晕.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_疑问.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_斜眼笑.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_笑哭.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_无奈.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_委屈.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_微笑.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_吐血.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_偷笑.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_调皮.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_调侃.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_思考.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_睡着.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_生气.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_生病.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_色.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_亲亲.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_呕吐.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_难过.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_目瞪口呆.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_腼腆.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_流泪.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_流汗.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_流鼻血.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_冷漠.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_困.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_抠鼻.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_可爱.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_惊吓.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_坏笑.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_黑人问号.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_害羞.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_鬼脸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_鼓掌.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_尴尬.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_发怒.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_发财.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_点赞.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_呆.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_大佬.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_大哭.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_打脸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_馋.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_闭嘴.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_鄙视.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_白眼.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/tv_doge.png",
       ],
       "小A和小B":[
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_应援.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_无语.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_问号.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_躺.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_摊手.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_司令.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_撒花.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_喝茶.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_哈哈哈哈.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_低头.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_大哭.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_吃瓜.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_捕捉.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_报警.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_OK.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/小A和小B_NO.png",
       ],
       "正经人":[
            "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_赞.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_悠闲.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_心.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_躺.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_揉脸.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_趴.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_拉.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_哭.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_开始.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_惊.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_挤.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_火.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_欢呼.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_放屁.png",
             "https://cdn.jsdelivr.net/gh/blogimg/emotion/bilibili/正经人_ok.png",
       ],
        "つり目獣耳スタンプ":[
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753776_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753777_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753778_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753779_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753780_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753781_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753782_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753783_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753784_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753785_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753786_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753787_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753788_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753789_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753790_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753791_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753792_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753793_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753794_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753795_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753796_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753797_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753798_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753799_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753800_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753801_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753802_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753803_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753804_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753805_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753806_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753807_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753808_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753809_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753810_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753811_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753812_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753813_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753814_key@2x.png",
             "https://valinecdn.bili33.top/Tsuri-me-ju_mimi/10753815_key@2x.png"
        ],
        "Arcaea":[
             "https://valinecdn.bili33.top/Arcaea/184064198.png",
             "https://valinecdn.bili33.top/Arcaea/184064199.png",
             "https://valinecdn.bili33.top/Arcaea/184064200.png",
             "https://valinecdn.bili33.top/Arcaea/184064201.png",
             "https://valinecdn.bili33.top/Arcaea/184064202.png",
             "https://valinecdn.bili33.top/Arcaea/184064203.png",
             "https://valinecdn.bili33.top/Arcaea/184064204.png",
             "https://valinecdn.bili33.top/Arcaea/184064205.png",
             "https://valinecdn.bili33.top/Arcaea/184064206.png",
             "https://valinecdn.bili33.top/Arcaea/184064207.png",
             "https://valinecdn.bili33.top/Arcaea/184064208.png",
             "https://valinecdn.bili33.top/Arcaea/184064209.png",
             "https://valinecdn.bili33.top/Arcaea/184064210.png",
             "https://valinecdn.bili33.top/Arcaea/184064211.png",
             "https://valinecdn.bili33.top/Arcaea/184064212.png",
             "https://valinecdn.bili33.top/Arcaea/184064213.png",
             "https://valinecdn.bili33.top/Arcaea/184064214.png",
             "https://valinecdn.bili33.top/Arcaea/184064215.png",
             "https://valinecdn.bili33.top/Arcaea/184064216.png",
             "https://valinecdn.bili33.top/Arcaea/184064217.png",
             "https://valinecdn.bili33.top/Arcaea/184064218.png",
             "https://valinecdn.bili33.top/Arcaea/184064219.png",
             "https://valinecdn.bili33.top/Arcaea/184064220.png",
             "https://valinecdn.bili33.top/Arcaea/184064221.png",
             "https://valinecdn.bili33.top/Arcaea/184064222.png",
             "https://valinecdn.bili33.top/Arcaea/184064223.png",
             "https://valinecdn.bili33.top/Arcaea/184064224.png",
             "https://valinecdn.bili33.top/Arcaea/184064225.png",
             "https://valinecdn.bili33.top/Arcaea/184064226.png",
             "https://valinecdn.bili33.top/Arcaea/184064227.png",
             "https://valinecdn.bili33.top/Arcaea/184064228.png",
             "https://valinecdn.bili33.top/Arcaea/184064229.png",
             "https://valinecdn.bili33.top/Arcaea/184064230.png",
             "https://valinecdn.bili33.top/Arcaea/184064231.png",
             "https://valinecdn.bili33.top/Arcaea/184064232.png",
             "https://valinecdn.bili33.top/Arcaea/184064233.png",
             "https://valinecdn.bili33.top/Arcaea/184064234.png",
             "https://valinecdn.bili33.top/Arcaea/184064235.png",
             "https://valinecdn.bili33.top/Arcaea/184064236.png",
             "https://valinecdn.bili33.top/Arcaea/184064237.png"
        ],
        "Snow-Miku":[
             "https://valinecdn.bili33.top/Snow-Miku/3583066@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583067@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583068@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583069@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583070@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583071@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583072@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583073@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583074@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583075@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583076@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583077@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583078@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583079@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583080@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583081@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583082@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583083@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583084@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583085@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583086@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583087@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583088@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583089@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583090@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583091@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583092@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583093@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583094@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583095@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583096@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583097@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583098@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583099@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583100@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583101@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583102@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583103@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583104@2x.png",
             "https://valinecdn.bili33.top/Snow-Miku/3583105@2x.png"
        ],
        "うさみみ少女":[
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311678.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311679.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311680.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311681.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311682.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311683.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311684.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311685.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311686.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311687.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311688.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311689.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311690.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311691.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311692.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311693.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311694.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311695.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311696.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311697.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311698.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311699.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311700.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311701.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311702.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311703.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311704.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311705.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311706.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311707.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311708.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311709.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311710.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311711.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311712.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311713.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311714.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311715.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311716.png",
             "https://valinecdn.bili33.top/Sweetie-Bunny/12311717.png"
        ],
        "Yurui-Neko":[
            "https://valinecdn.bili33.top/Yurui-Neko/001.png",
            "https://valinecdn.bili33.top/Yurui-Neko/002.png",
            "https://valinecdn.bili33.top/Yurui-Neko/003.png",
            "https://valinecdn.bili33.top/Yurui-Neko/004.png",
            "https://valinecdn.bili33.top/Yurui-Neko/005.png",
            "https://valinecdn.bili33.top/Yurui-Neko/006.png",
            "https://valinecdn.bili33.top/Yurui-Neko/007.png",
            "https://valinecdn.bili33.top/Yurui-Neko/008.png",
            "https://valinecdn.bili33.top/Yurui-Neko/009.png",
            "https://valinecdn.bili33.top/Yurui-Neko/010.png",
            "https://valinecdn.bili33.top/Yurui-Neko/011.png",
            "https://valinecdn.bili33.top/Yurui-Neko/012.png",
            "https://valinecdn.bili33.top/Yurui-Neko/013.png",
            "https://valinecdn.bili33.top/Yurui-Neko/014.png",
            "https://valinecdn.bili33.top/Yurui-Neko/015.png",
            "https://valinecdn.bili33.top/Yurui-Neko/016.png",
            "https://valinecdn.bili33.top/Yurui-Neko/017.png",
            "https://valinecdn.bili33.top/Yurui-Neko/018.png",
            "https://valinecdn.bili33.top/Yurui-Neko/019.png",
            "https://valinecdn.bili33.top/Yurui-Neko/020.png",
            "https://valinecdn.bili33.top/Yurui-Neko/021.png",
            "https://valinecdn.bili33.top/Yurui-Neko/022.png",
            "https://valinecdn.bili33.top/Yurui-Neko/023.png",
            "https://valinecdn.bili33.top/Yurui-Neko/024.png",
            "https://valinecdn.bili33.top/Yurui-Neko/025.png",
            "https://valinecdn.bili33.top/Yurui-Neko/026.png",
            "https://valinecdn.bili33.top/Yurui-Neko/027.png",
            "https://valinecdn.bili33.top/Yurui-Neko/028.png",
            "https://valinecdn.bili33.top/Yurui-Neko/029.png",
            "https://valinecdn.bili33.top/Yurui-Neko/030.png",
            "https://valinecdn.bili33.top/Yurui-Neko/031.png",
            "https://valinecdn.bili33.top/Yurui-Neko/032.png",
            "https://valinecdn.bili33.top/Yurui-Neko/033.png",
            "https://valinecdn.bili33.top/Yurui-Neko/034.png",
            "https://valinecdn.bili33.top/Yurui-Neko/035.png",
            "https://valinecdn.bili33.top/Yurui-Neko/036.png",
            "https://valinecdn.bili33.top/Yurui-Neko/037.png",
            "https://valinecdn.bili33.top/Yurui-Neko/038.png",
            "https://valinecdn.bili33.top/Yurui-Neko/039.png",
            "https://valinecdn.bili33.top/Yurui-Neko/040.png"
        ],
        "Convenience Store Notes2":[
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/001.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/002.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/003.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/004.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/005.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/006.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/007.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/008.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/009.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/010.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/011.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/012.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/013.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/014.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/015.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/016.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/017.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/018.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/019.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/020.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/021.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/022.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/023.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/024.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/025.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/026.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/027.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/028.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/029.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/030.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/031.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/032.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/033.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/034.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/035.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/036.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/037.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/038.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/039.png",
            "https://valinecdn.bili33.top/Convenience-Store-Notes2/040.png"
        ],
        "嗷大喵":[
            "https://valinecdn.bili33.top/aodamiao/01.gif",
            "https://valinecdn.bili33.top/aodamiao/02.gif",
            "https://valinecdn.bili33.top/aodamiao/03.gif",
            "https://valinecdn.bili33.top/aodamiao/04.gif",
            "https://valinecdn.bili33.top/aodamiao/05.gif",
            "https://valinecdn.bili33.top/aodamiao/06.gif",
            "https://valinecdn.bili33.top/aodamiao/07.gif",
            "https://valinecdn.bili33.top/aodamiao/08.gif",
            "https://valinecdn.bili33.top/aodamiao/09.gif",
            "https://valinecdn.bili33.top/aodamiao/10.gif",
            "https://valinecdn.bili33.top/aodamiao/11.gif",
            "https://valinecdn.bili33.top/aodamiao/12.gif",
            "https://valinecdn.bili33.top/aodamiao/13.gif",
            "https://valinecdn.bili33.top/aodamiao/14.gif",
            "https://valinecdn.bili33.top/aodamiao/15.gif",
            "https://valinecdn.bili33.top/aodamiao/16.gif",
            "https://valinecdn.bili33.top/aodamiao/17.gif",
            "https://valinecdn.bili33.top/aodamiao/18.gif",
            "https://valinecdn.bili33.top/aodamiao/19.gif",
            "https://valinecdn.bili33.top/aodamiao/20.gif",
            "https://valinecdn.bili33.top/aodamiao/21.gif",
            "https://valinecdn.bili33.top/aodamiao/22.gif",
            "https://valinecdn.bili33.top/aodamiao/23.gif",
            "https://valinecdn.bili33.top/aodamiao/24.gif",
            "https://valinecdn.bili33.top/aodamiao/25.gif",
            "https://valinecdn.bili33.top/aodamiao/26.gif",
            "https://valinecdn.bili33.top/aodamiao/27.gif",
            "https://valinecdn.bili33.top/aodamiao/28.gif",
            "https://valinecdn.bili33.top/aodamiao/29.gif",
            "https://valinecdn.bili33.top/aodamiao/30.gif",
            "https://valinecdn.bili33.top/aodamiao/31.gif",
            "https://valinecdn.bili33.top/aodamiao/32.gif",
            "https://valinecdn.bili33.top/aodamiao/33.gif",
            "https://valinecdn.bili33.top/aodamiao/34.gif",
            "https://valinecdn.bili33.top/aodamiao/35.gif",
            "https://valinecdn.bili33.top/aodamiao/36.gif",
            "https://valinecdn.bili33.top/aodamiao/37.gif",
            "https://valinecdn.bili33.top/aodamiao/38.gif",
            "https://valinecdn.bili33.top/aodamiao/39.gif",
            "https://valinecdn.bili33.top/aodamiao/40.gif"
        ],
        "小黑盒":[
            "https://valinecdn.bili33.top/Heybox/expression_cube.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_bingbujiandan.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_bizui.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_cangsang.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_dalian.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_doge.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_gandong.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_guai.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_gugu.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_han.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_hbi.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_heirenwenhao.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_huaji.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_jiayou.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_jingya.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_kaixin.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_ku.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_kun.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_kuqi.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_nu.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_penshui.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_qiliang.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_shengqi.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_shuijiao.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_tanqi.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_tanshou.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_tu.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_wa.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_weiqu.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_weixiao.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_wulianku.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_xia.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_xiaocry.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_xihuan.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_xuexi.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_yun.png",
            "https://valinecdn.bili33.top/Heybox/expression_cube_zan.png",
            "https://valinecdn.bili33.top/Heybox/expression_heyboxgirl.png",
            "https://valinecdn.bili33.top/Heybox/expression_heyboxgirl_v2.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_aidao.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_baipiaoguai.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_chi.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_chigua.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_eihei.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_haha.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_haixiu.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_henaicha.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_huaji.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_jing.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_jixialai.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_kaikele.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_ku.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_kujiuruhou.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_nielian.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_qiaokaixin.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_qiehua.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_rua.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_toukan.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_tu.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_wuyu.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_xihuan.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_yiwen.png",
            "https://valinecdn.bili33.top/Heybox/expression_heygirl_zhe.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_1.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_10.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_11.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_12.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_13.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_14.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_15.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_16.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_17.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_18.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_19.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_2.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_20.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_21.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_22.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_23.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_24.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_25.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_26.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_27.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_28.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_29.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_3.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_30.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_31.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_32.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_4.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_5.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_6.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_7.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_8.png",
            "https://valinecdn.bili33.top/Heybox/expression_heziji_9.png",
        ],
        "屑魔女伊雷娜":[
            "https://valinecdn.bili33.top/Majotabi/367516718.png",
            "https://valinecdn.bili33.top/Majotabi/367516719.png",
            "https://valinecdn.bili33.top/Majotabi/367516720.png",
            "https://valinecdn.bili33.top/Majotabi/367516721.png",
            "https://valinecdn.bili33.top/Majotabi/367516722.png",
            "https://valinecdn.bili33.top/Majotabi/367516723.png",
            "https://valinecdn.bili33.top/Majotabi/367516724.png",
            "https://valinecdn.bili33.top/Majotabi/367516725.png",
            "https://valinecdn.bili33.top/Majotabi/367516726.png",
            "https://valinecdn.bili33.top/Majotabi/367516727.png",
            "https://valinecdn.bili33.top/Majotabi/367516728.png",
            "https://valinecdn.bili33.top/Majotabi/367516729.png",
            "https://valinecdn.bili33.top/Majotabi/367516730.png",
            "https://valinecdn.bili33.top/Majotabi/367516731.png",
            "https://valinecdn.bili33.top/Majotabi/367516732.png",
            "https://valinecdn.bili33.top/Majotabi/367516733.png",
            "https://valinecdn.bili33.top/Majotabi/367516734.png",
            "https://valinecdn.bili33.top/Majotabi/367516735.png",
            "https://valinecdn.bili33.top/Majotabi/367516736.png",
            "https://valinecdn.bili33.top/Majotabi/367516737.png",
            "https://valinecdn.bili33.top/Majotabi/367516738.png",
            "https://valinecdn.bili33.top/Majotabi/367516739.png",
            "https://valinecdn.bili33.top/Majotabi/367516740.png",
            "https://valinecdn.bili33.top/Majotabi/367516741.png",
            "https://valinecdn.bili33.top/Majotabi/367516742.png",
            "https://valinecdn.bili33.top/Majotabi/367516743.png",
            "https://valinecdn.bili33.top/Majotabi/367516744.png",
            "https://valinecdn.bili33.top/Majotabi/367516745.png",
            "https://valinecdn.bili33.top/Majotabi/367516746.png",
            "https://valinecdn.bili33.top/Majotabi/367516747.png",
            "https://valinecdn.bili33.top/Majotabi/367516748.png",
            "https://valinecdn.bili33.top/Majotabi/367516749.png",
            "https://valinecdn.bili33.top/Majotabi/367516750.png",
            "https://valinecdn.bili33.top/Majotabi/367516751.png",
            "https://valinecdn.bili33.top/Majotabi/367516752.png",
            "https://valinecdn.bili33.top/Majotabi/367516753.png",
            "https://valinecdn.bili33.top/Majotabi/367516754.png",
            "https://valinecdn.bili33.top/Majotabi/367516755.png",
            "https://valinecdn.bili33.top/Majotabi/367516756.png",
            "https://valinecdn.bili33.top/Majotabi/367516757.png",
        ]
    };

    // 新建表情包插件,运行main()方法
    var showDebug = false;
    var plugin = new SetycyasFacePlugin($textarea,faceTable,showDebug,beforeElement);
    plugin.main();
}

var reply_display = false;
var exec_script = false;

/** 执行代码,如无必要,不要修改FaceSet与SetycyasPlugin两个类.
 * 在这里修改执行代码,应该足够对应不同论坛的设定以及自定义表情.
 */
(function(){
    //这一句指定文本框,应对不同论坛请修改这里
    var $textarea = $("form[name=FORM] textarea[name=atc_content]");
    if ($textarea.length == 0) {
        $textarea = $("#fastpostmessage");
    }
    _init_scirpt($textarea, $("#fastpostreturn"));

    var tmpInterval = setInterval(function(){
        if (document.querySelector("#fwin_reply") != null) {
            reply_display = true;
            if (!exec_script) {
                exec_script = true;
                _init_scirpt($("#postmessage"), $("#postmessage").closest("div.tedt"));
            }
        } else {
            reply_display = false;
            if (exec_script) {
                exec_script = false;
                //console.log("close 1");
            }
        }
    }, 1000);
})();