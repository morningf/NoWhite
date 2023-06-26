//块类型
var GridType = {
    WhiteGrid:0,
    BlackGrid:1,
    NoGrid:0,
    YesGrid:1      //可以踩的块
};

//其他配置
var OtherConfig = {
    LineWidth:1,  //块之间的分割线宽度
    RowNum:4,     //一屏要显示的行数
    ColNum:4,      //一屏要显示的列数
    FaultTolerant:40, //容错区域像素
}

//游戏模式
var GameMode = {
    Start:0,
    Help:1,
    About:2
};

//开始界面菜单
var MenuSprites = {
    Count:3,
    Texts:["别踩白块", "游戏帮助", "关于"]
};

//块类
//块类初始化后需要调用setGridType来明确块的类型
var GridSprite = cc.Sprite.extend({
    _gridType:null,

    ctor:function(w, h) {
        this._super();
        this.anchorX = 0;
        this.anchorY = 0;
        this.setTextureRect(cc.rect(0, 0, w, h));
        this._gridType = GridType.WhiteGrid;
        this.setColor(cc.color.WHITE);

        return true;
    },

    setGridType : function(t) {
        this._gridType = t;
        if (this._gridType == GridType.WhiteGrid)
        {
            this.setColor(cc.color.WHITE);
        }
        else
        {
            this.setColor(cc.color.BLACK);
        }
    }
});

//一行块类
var RowGridSprite = cc.Sprite.extend({
    _col:OtherConfig.ColNum,
    _sprites:null,
    _cur:0, //当前的YseGrid索引

    ctor:function(w, h) {
        this._super();

        this.ininData(w, h);

        return true;
    },

    ininData:function(w, h) {
        w = (w - (this._col - 1) * OtherConfig.LineWidth) / this._col;
        this._sprites = {};
        this._cur = Math.round(Math.random() * (this._col - 1));
        for (var i = 0; i < this._col; ++i)
        {
            var sp = new GridSprite(w, h);
            sp.x = i * (w + OtherConfig.LineWidth);
            if (i == this._cur)
                sp.setGridType(GridType.YesGrid);
            else
                sp.setGridType(GridType.NoGrid);
            this.addChild(sp);
            this._sprites[i] = sp;
        }
    },

    refreshGridType:function() {
        this._sprites[this._cur].setGridType(GridType.NoGrid);
        this._cur = Math.round(Math.random() * (this._col - 1));
        this._sprites[this._cur].setGridType(GridType.YesGrid);
    },

    getCurWidthRange:function() {
        var sp = this._sprites[this._cur];
        return {l:sp.x - OtherConfig.FaultTolerant, r:sp.x + sp.width + OtherConfig.FaultTolerant};
    },

    touchRight:function(isRight) {
        if (isRight)
        {
            this._sprites[this._cur].setColor(cc.color(125,125,125));
        }
        else
        {
            this._sprites[this._cur].setColor(cc.color.RED);
        }
    }
});

var GameEndLayer = cc.Layer.extend({
    ctor:function(succeed, scores, time) {
        this._super();

        var size = cc.winSize;

        if(succeed)
        {
            var txtTime = Math.floor(time / 10).toString() + '.' + (time % 10).toString() + '"';
            var label = new cc.LabelTTF("胜利!\n" + txtTime, "MSYH.TTC", 38, cc.size(size.width, 200),
                cc.TEXT_ALIGNMENT_CENTER, cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            label.anchorX = 0;
            label.anchorY = 0;
            label.x = 0;
            label.y = size.height - 300;
            var color = cc.color.GREEN;
            label.setColor(color);
            this.addChild(label);
        }
        else
        {
            var label = new cc.LabelTTF("失败!", "MSYH.TTC", 38, cc.size(size.width, 200),
                cc.TEXT_ALIGNMENT_CENTER, cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            label.anchorX = 0;
            label.anchorY = 0;
            label.x = 0;
            label.y = size.height - 300;
            var color = cc.color.RED;
            label.setColor(color);
            this.addChild(label);
        }

        var btnRestart = new cc.MenuItemFont("重试  ", function() {
            cc.director.popScene();
            var scene = new GamePlayScene();
            cc.director.pushScene(scene);
        }, this);
        var btnReturn = new cc.MenuItemFont("  返回", function() {
            cc.director.popToRootScene();
        }, this);

        var mn = new cc.Menu(btnRestart, btnReturn);
        mn.alignItemsHorizontally();
        this.addChild(mn);
    }
});

var GameEndScene = cc.Scene.extend({
    succeed:null,
    scores:null,
    time:null,

    ctor:function(succeed, scores, time) {
        this._super();
        this.succeed = succeed;
        this.scores = scores;
        this.time = time;
        return true;
    },

    onEnter:function () {
        this._super();
        var layer = new GameEndLayer(this.succeed, this.scores, this.time);
        this.addChild(layer);
    }
});

//游戏运行层
var GamePlayLayer = cc.Layer.extend({
    _row:OtherConfig.RowNum,
    _rowHeight:null,
    _sprites:null,
    _headNum:0,     	//头行索引
    _curNum:0,      	//当前激活行索引
    _gameStart:false, 	//游戏是否开始
    _yesNum:0, 			//点击正确的数量
    _yesNumForSuc:50, 	//游戏胜利需要点击的数量

    onEnter:function(){
        this._super();
        this.initData();
    },

    initData:function() {
        this._sprites = {};
        var size = cc.winSize;
        this._rowHeight = (size.height - (this._row - 1) * OtherConfig.LineWidth) / this._row;

        for (var i = 0; i <= this._row; ++i)
        {
            var sp = new RowGridSprite(size.width, this._rowHeight);
            sp.y = (i+1) * (this._rowHeight + OtherConfig.LineWidth);
            this.addChild(sp);
            this._sprites[i] = sp;
        }
    },

    touchOneGrid:function(tx) {
        var sp = this._sprites[this._curNum];
        var range= sp.getCurWidthRange();
        var isRight = null;
        if (tx >= range.l && tx <= range.r)
        {
            isRight = true;
        }
        else
        {
            isRight = false;
        }

        sp.touchRight(isRight);
        if (isRight)
        {
            this._curNum++;
            if (this._curNum > this._row)
                this._curNum = 0;
            this.nextFrameAction();
        }
        else
        {
            this.gameEndAndFail();
        }
    },

    nextFrameAction:function() {
        this._yesNum++;
        if (!this._gameStart)
            this.parent.uiLayer.gameStart();
        var act = cc.moveBy(0.07, cc.p(0, - this._rowHeight - OtherConfig.LineWidth));
        var acf = cc.callFunc(this._nextFrameActionCallBack, this);
        var seq = cc.sequence(act, acf);
        this.runAction(seq);
    },

    _nextFrameActionCallBack:function() {
        if (this._yesNum == this._yesNumForSuc)
        {
            this.parent.uiLayer.gameEnd();
            var scene = new GameEndScene(true, this._yesNum, this.parent.uiLayer.countTime);
            cc.director.popScene();
            cc.director.pushScene(scene);
            return;
        }

        if (!this._gameStart)
        {
            this._gameStart = true;
        }
        else
        {
            if(this._yesNum + this._row <= this._yesNumForSuc)
            {
                var tailNum = this._headNum == 0 ? this._row : this._headNum - 1;
                var sp = this._sprites[this._headNum];
                sp.y = this._sprites[tailNum].y + this._rowHeight + OtherConfig.LineWidth;
                sp.refreshGridType();
                this._headNum++;
                if (this._headNum > this._row)
                    this._headNum = 0;
            }
        }
    },

    gameEndAndFail:function() {
        this.parent.uiLayer.gameEnd();
        var scene = new GameEndScene(false, this._yesNum, this.parent.uiLayer.countTime);
        cc.director.popScene();
        cc.director.pushScene(scene);
    }
});

var GamePlayUiLayer = cc.Layer.extend({
    lblTime:null,
    countTime:0,

    onEnter:function() {
        this._super();
        var size = cc.winSize;
        var h = 50;
        this.lblTime = new cc.LabelTTF("0.0", "MSYH.TTC", 38, cc.size(size.width, h),
            cc.TEXT_ALIGNMENT_CENTER, cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.lblTime.attr({
            anchorX:0,
            anchorY:0,
            x:0,
            y:size.height - h
        });
        this.lblTime.setColor(cc.color.RED);
        this.addChild(this.lblTime);
    },

    gameStart : function() {
        this.schedule(this.timeCallback, 0.1);
    },

    gameEnd : function() {
        this.unschedule(this.timeCallback);
    },

    timeCallback : function() {
        this.countTime += 1;
        var txt = Math.floor(this.countTime / 10).toString() + '.' + (this.countTime % 10).toString() + '"';
        this.lblTime.setString(txt);
    }
});

var GamePlayTouchLayer = cc.Layer.extend({
	onEnter:function() {
        this._super();
		cc.eventManager.addListener({
			event : cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches : true,
			onTouchBegan : this.onTouchBegan
		}, this);
	},
	
	onTouchBegan:function(touch, event) {
		var target = event.getCurrentTarget();
		var locationInNode = target.convertToNodeSpace(touch.getLocation());
		var s = target.getContentSize();
		var rect = cc.rect(0, 0, s.width, s.height);
		if (cc.rectContainsPoint(rect, locationInNode))
        {
            target.parent.gameLayer.touchOneGrid(touch.getLocation().x);
        }
        return false;
	}
});

//游戏运行场景
var GamePlayScene = cc.Scene.extend({
    uiLayer:null,
    touchLayer:null,
    gameLayer:null,
    onEnter:function () {
        this._super();
        var size = cc.winSize;
        this.gameLayer = new GamePlayLayer();
        this.addChild(this.gameLayer);
        this.uiLayer = new GamePlayUiLayer();
        this.addChild(this.uiLayer);
        this.touchLayer = new GamePlayTouchLayer();
        this.touchLayer.attr({
            anchorX:0,
            anchorY:0,
            x:0,
            y:size.height / OtherConfig.RowNum,
            width:size.width,
            height:size.height / OtherConfig.RowNum + 80
        });
        this.addChild(this.touchLayer);
    }
});

//游戏帮助层
var GameHelpLayer = cc.Layer.extend({
    onEnter:function(){
        this._super();
        var strHelp = "点击黑块，在尽可能短的时间内点够50个黑块。";
        var size = cc.winSize;
        var label = new cc.LabelTTF(strHelp, "MSYH.TTC", 30, cc.size(size.width - 50, 200),
            cc.TEXT_ALIGNMENT_LEFT, cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        label.anchorX = 0;
        label.anchorY = 0;
        label.x = 25;
        label.y = size.height - 300;
        var color = cc.color.GREEN;
        label.setColor(color);
        this.addChild(label);

        var btnReturn = new cc.MenuItemFont("返回", function() {
            cc.director.popToRootScene();
        }, this);

        var mn = new cc.Menu(btnReturn);
        mn.alignItemsHorizontally();
        this.addChild(mn);
    }
});

//游戏帮助场景
var GameHelpScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new GameHelpLayer();
        this.addChild(layer);
    }
});

//游戏关于层
var GameAboutLayer = cc.Layer.extend({
    onEnter:function(){
        this._super();

        var strHelp = "游艺道游戏";
        var size = cc.winSize;
        var label = new cc.LabelTTF(strHelp, "MSYH.TTC", 30, cc.size(size.width - 50, 200),
            cc.TEXT_ALIGNMENT_CENTER, cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        label.anchorX = 0;
        label.anchorY = 0;
        label.x = 25;
        label.y = size.height - 300;
        var color = cc.color.GREEN;
        label.setColor(color);
        this.addChild(label);

        var btnGuan = new cc.MenuItemFont("访问官网", function (){
            if (!cc.sys.isNative) {
                window.open("http://www.91yyd.com", "_blank");
            }
        }, this);
        var btnReturn = new cc.MenuItemFont("返回", function() {
            cc.director.popToRootScene();
        }, this);

        var mn = new cc.Menu(btnGuan, btnReturn);
        mn.alignItemsVertically();
        this.addChild(mn);
    }
});

//游戏关于场景
var GameAboutScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new GameAboutLayer();
        this.addChild(layer);
    }
});

//开始界面菜单精灵
var MyMenuSprite = cc.Sprite.extend({
    _modeIndex:null,

    ctor:function(index) {
        this._super();
        this._modeIndex = index;

        this.initSize();
        this.initBackColorAndText();

        cc.eventManager.addListener({
            event : cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches : false,
            onTouchBegan : this.onTouchBegan,
            onTouchEnded : this.onTouchEnded
        }, this);
    },

    initSize:function() {
        var size = cc.winSize;
        var w = size.width;
        var h = size.height / MenuSprites.Count;
        this.anchorX = 0;
        this.anchorY = 0;
        this.y = h * (MenuSprites.Count - 1 - this._modeIndex);
        this.setTextureRect(cc.rect(0, 0, w, h));
    },

    initBackColorAndText:function () {
        var color = this._modeIndex % 2 == 1 ? cc.color.WHITE : cc.color.BLACK;
        this.setColor(color);
        var label = new cc.LabelTTF(MenuSprites.Texts[this._modeIndex], "MSYH.TTC", 38, cc.size(this.width - 50, this.height - 50),
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER, cc.TEXT_ALIGNMENT_CENTER);
        label.anchorX = 0;
        label.anchorY = 0;
        label.x = 25;
        label.y = 25;
        var adv_color = new cc.color(255 - color.r, 255 - color.g, 255 - color.b);
        label.setColor(adv_color);
        this.addChild(label);
    },

    onTouchBegan:function(touch, event) {
        var target = event.getCurrentTarget();
        var locationInNode = target.convertToNodeSpace(touch.getLocation());
        var s = target.getContentSize();
        var rect = cc.rect(0, 0, s.width, s.height);
        if (cc.rectContainsPoint(rect, locationInNode))
            return true;
        else
            return false;
    },

    onTouchEnded:function(touch, event) {
        var target = event.getCurrentTarget();
        switch (target._modeIndex)
        {
            case GameMode.Start:
                var scene = new GamePlayScene();
                cc.director.pushScene(new cc.TransitionSlideInL(0.4, scene));
                break;
            case GameMode.Help:
                var scene = new GameHelpScene();
                cc.director.pushScene(new cc.TransitionSlideInL(0.4, scene));
                break;
            case GameMode.About:
                var scene = new GameAboutScene();
                cc.director.pushScene(new cc.TransitionSlideInL(0.4, scene));
                break;
            default:
                return;
        }
    }
});

//开始界面层
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,

    ctor:function() {
        this._super();

        var size = cc.winSize;

        for (var i = 0; i < 3; ++i)
        {
            var sp = new MyMenuSprite(i);
            this.addChild(sp);
        }

        return true;
    }
});

//开始界面场景
var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

