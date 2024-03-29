//==============================================================================
// jScrollView
//
// Widget to handle scroll bars on a container div.
// Inspired by http://jscrollpane.kelvinluck.com/
//
// Requirements
//  Container element must have one child Content element
//  jScroll relies on caller to notify when Container or Content changes in size
//      $('selector').data('jsv').resize();
//      $('selector').data('jsv').scroll(v|h|v,h);
// config: {
//  vertical, horizontal: null, "auto", "visible"
//    width: integer
//  arrows: true,false
//  mousewheel: true,false
//  repeatTimers: function(n){ return millisecond_timeout; }
//  classPrefix: "jsv"
// }
//
// Copyright (c) 2011 Guyon Roche
// Dual licensed under the MIT or GPL Version 2 licenses.
//
// TODO
//    convert magic numbers into config
//        line height for arrow scroll
// optional hide when not active (like bbc scrollbars)

(function($,window,undefined){

jQuery.fn.jScrollView = function(config) {
    // constants
    var prefix = config.classPrefix ? config.classPrefix  : 'jsv';
    var classes = {
        bar: prefix + 'Bar', barOver: prefix + 'BarOver', barActive: prefix + 'BarClick',
        handle: prefix + 'Handle', handleOver: prefix + 'HandleOver', handleActive: prefix + 'HandleActive',
        arrowUp: prefix + 'ArrowUp', arrowUpOver: prefix + 'ArrowUpOver', arrowUpActive: prefix + 'ArrowUpActive',
        arrowDown: prefix + 'ArrowDown', arrowDownOver: prefix + 'ArrowDownOver', arrowDownActive: prefix + 'ArrowDownActive',
        arrowLeft: prefix + 'ArrowLeft', arrowLeftOver: prefix + 'ArrowLeftOver', arrowLeftActive: prefix + 'ArrowLeftActive',
        arrowRight: prefix + 'ArrowRight', arrowRightOver: prefix + 'ArrowRightOver', arrowRightActive: prefix + 'ArrowRightActive',
        square: prefix + 'Square'
    };
    var repeatTimers = config.repeatTimers ? config.repeatTimers : function(n) {
        if (n <= 1) {
            return 1000;
        } else if (n <= 25) {
            return 100;
        } else {
            return 50;
        }
    };
    
    var VAL = { // Vertical Abstraction Layer
        init: function($container, $scroll, $bar, $handle, $bakArrow, $fwdArrow) {
            var vs = this.vs($container);
            $scroll.css('top', 0);
            $scroll.css('left', $container.width() - config.width);
            $scroll.width(config.width);
            $scroll.height(vs);

            if ($bakArrow) {
                $bar.css('top', config.width);
                $bar.height(vs - 2 * config.width);
        
                $bakArrow.width(config.width);
                $bakArrow.height(config.width);
                
                $fwdArrow.width(config.width);
                $fwdArrow.height(config.width);
            } else {
                $bar.css('top', 0);
                $bar.height(vs);
            }
            $bar.css('left', 0);
            $bar.width(config.width);
            
            $handle.css('top', 0);
            $handle.css('left', 0);
            $handle.width(config.width);
            $handle.height(config.width);
        },
        resize: function($container, $scroll, $bar, $fwdArrow, margin) {
            $scroll.css('left', $container.innerWidth()-config.width);
            if ($fwdArrow) {
                $fwdArrow.css('top', $container.innerHeight() - config.width - margin);
                $bar.height($container.innerHeight() - margin - 2 * config.width);
            } else {
                $bar.height($container.innerHeight() - margin);
            }
        },
        pageDirection: function(event, $bar, $handle) {
            if (event.offsetY < $handle.position().top) return -1;
            if (event.offsetY > $handle.position().top + $handle.height()) return 1;
            return 0;
        },
        d_bak: 'Up',
        d_fwd: 'Down',
        vs: function($container) { return $container.height(); },
        cs: function($content) { return $content.height(); },
        sp: function($content, p) { return (p != undefined) ? -$content.css('top', -p) : -$content.position().top; },
        hp: function($handle, p) { return (p != undefined) ? $handle.css('top', p) : $handle.position().top; },
        dp: function(e, s) { return e.pageY - s.pageY; },
        hs: function($handle, s) { return (s != undefined) ? $handle.height(s) : $handle.height(); }
    };
    var HAL = { // Horizontal Abstraction Layer
        init: function($container, $scroll, $bar, $handle, $bakArrow, $fwdArrow) {
            var vs = this.vs($container);
            
            $scroll.css('left', 0);
            $scroll.css('top', $container.height() - config.width);
            $scroll.height(config.width);
            $scroll.width(vs);

            if ($bakArrow) {
                $bar.css('left', config.width);
                $bar.width(vs - 2 * config.width);
        
                $bakArrow.width(config.width);
                $bakArrow.height(config.width);
                
                $fwdArrow.width(config.width);
                $fwdArrow.height(config.width);
            } else {
                $bar.css('left', 0);
                $bar.width(vs);
            }
            $bar.css('top', 0);
            $bar.height(config.width);
            
            $handle.css('top', 0);
            $handle.css('left', 0);
            $handle.width(config.width);
            $handle.height(config.width);
        },
        resize: function($container, $scroll, $bar, $fwdArrow, margin) {
            $scroll.css('top', $container.innerHeight()-config.width);
            if ($fwdArrow) {
                $fwdArrow.css('left', $container.innerWidth() - config.width - margin);
                $bar.width($container.innerWidth() - margin - 2 * config.width);
            } else {
                $bar.width($container.innerWidth() - margin);
            }
        },
        pageDirection: function(event, $bar, $handle) {
            if (event.offsetX < $handle.position().left) return -1;
            if (event.offsetX > $handle.position().left + $handle.width()) return 1;
            return 0;
        },
        d_bak: 'Left',
        d_fwd: 'Right',
        vs: function($container) { return $container.width(); },
        cs: function($content) { return $content.width(); },
        sp: function($content, p) { return (p != undefined) ? -$content.css('left', -p) : -$content.position().left; },
        hp: function($handle, p) { return (p != undefined) ? $handle.css('left', p) : $handle.position().left; },
        dp: function(e, s) { return e.pageX - s.pageX; },
        hs: function($handle, s) { return (s != undefined) ? $handle.width(s) : $handle.width(); }
    };
    var JNullBar = {
        resize: function() {},
        scroll: function() {},
        width: function() { return 0; }
    }
    function JScrollBar($container, $content, engine, s) {
        this.$container = $container;
        this.$content = $content;
        this.engine = engine;
        this.auto = (s == "auto");
        this.visible = false;
        this.margin = 0;
        
        this.$container.append('<div style="display: none; position:absolute;"></div>');
        this.$scroll = $(this.$container[0].lastChild);

        this.$scroll.append('<div style="position:absolute;" class="' + classes.bar + '"></div>');
        this.$bar = $(this.$scroll[0].lastChild);
        
        this.$bar.append('<div style="position:absolute;" class="' + classes.handle + '"></div>');
        this.$handle = $(this.$bar.children("." + classes.handle));
        
        if (config.arrows) {
            this.arrowClasses = {
                bak: {
                    arrow: classes['arrow' + this.engine.d_bak],
                    over: classes['arrow' + this.engine.d_bak + 'Over'],
                    active: classes['arrow' + this.engine.d_bak + 'Active']
                },
                fwd: {
                    arrow: classes['arrow' + this.engine.d_fwd],
                    over: classes['arrow' + this.engine.d_fwd + 'Over'],
                    active: classes['arrow' + this.engine.d_fwd + 'Active']
                }
            };
            
            this.$scroll.append('<div style="position:absolute;" class="' + this.arrowClasses.bak.arrow + '"></div>');
            this.$bakArrow = $(this.$scroll.children("." + this.arrowClasses.bak.arrow));
            this.$bakArrow.classes = this.arrowClasses.bak;

            this.$scroll.append('<div style="position:absolute;" class="' + this.arrowClasses.fwd.arrow + '"></div>');
            this.$fwdArrow = $(this.$scroll.children("." + this.arrowClasses.fwd.arrow));
            this.$fwdArrow.classes = this.arrowClasses.fwd;
        }
        
        this.engine.init(this.$container, this.$scroll, this.$bar, this.$handle, this.$bakArrow, this.$fwdArrow);

        var self = this;
        
        this.$bar.mouseover(function(event) {
            self.$bar.addClass(classes.barOver);
            self.$handle.removeClass(classes.handleOver);
            event.stopImmediatePropagation();
        }).mouseleave(function(event) {
            self.$bar.removeClass(classes.barOver);
            event.stopImmediatePropagation();
        });
        this.$handle.mouseover(function(event) {
            self.$handle.addClass(classes.handleOver);
            self.$bar.removeClass(classes.barOver);
            event.stopImmediatePropagation();
        }).mouseleave(function(event) {
            self.$handle.removeClass(classes.handleOver);
            event.stopImmediatePropagation();
        });
        
        // Handle Drag
        this.$handle.mousedown(function(event){
            // disable text selection
            $('html').bind('dragstart.jsv selectstart.jsv', function (){ return false; });
            event.stopImmediatePropagation();
            self.$handle.addClass(classes.handleActive);
            
            self.start = {
                hp: self.engine.hp(self.$handle),
                pageX: event.pageX,
                pageY: event.pageY
            };
            $('html').bind('mousemove.jsv', function(eMove) {
                var dp = self.engine.dp(eMove, self.start);
                var vs = self.engine.vs(self.$container) - self.margin;
                var bs = self.$fwdArrow ? vs - 2 * config.width : vs;
                var hs = self.engine.hs(self.$handle);
                var hp = Math.max(0, Math.min(self.start.hp + dp, bs-hs));
                self.engine.hp(self.$handle, hp);
                
                // now scroll content
                var cs = self.engine.cs(self.$content);
                var sp = Math.floor(hp*(cs-vs)/(bs-hs));
                self.engine.sp(self.$content, sp);
            }).bind('mouseup.jsv', function(eUp){
                $('html').unbind('mouseup.jsv mousemove.jsv dragstart.jsv selectstart.jsv');
                self.$handle.removeClass(classes.handleActive);
            });
        });
        
        // bar paging
        this.$bar.mousedown(function(event){
            var scrollPage = function(dir) {
                var vs = self.engine.vs(self.$container) - self.margin;
                var bs = self.$fwdArrow ? vs - 2 * config.width : vs;
                var hs = self.engine.hs(self.$handle);
                var hp = self.engine.hp(self.$handle);
                
                hp = Math.max(0, Math.min(bs - hs, hp + dir * hs));
                self.engine.hp(self.$handle, hp);
    
                var cs = self.engine.cs(self.$content);
                var sp = Math.floor(hp*(cs-vs)/(bs-hs));
                self.engine.sp(self.$content, sp);
            }
            // disable text selection
            $('html').bind('dragstart.jsv selectstart.jsv', function (){ return false; });
            event.stopImmediatePropagation();
            self.$bar.addClass(classes.barActive);
            
            // determine direction
            var eventData = { offsetX: event.offsetX, offsetY: event.offsetY };
            var dir = self.engine.pageDirection(eventData, self.$bar, self.$handle);
            scrollPage(dir);
            
            // set timer for repeats
            var timer;
            var n = 1;
            var iterate = function(){
                if (dir == self.engine.pageDirection(eventData, self.$bar, self.$handle)) {
                    scrollPage(dir);
                }
                timer = setTimeout(iterate, repeatTimers(n++));
            };
            timer = setTimeout(iterate, repeatTimers(n++));
            
            self.$bar.bind('mousemove.jsv', function(event){
                eventData = { offsetX: event.offsetX, offsetY: event.offsetY };
            }).bind('mouseup.jsv', function(){
                self.$bar.unbind('mouseup.jsv mousemove.jsv');
                $('html').unbind('dragstart.jsv selectstart.jsv');
                clearTimeout(timer);
                self.$bar.removeClass(classes.barActive);
            });
        });
        
        // Arrows
        if (config.arrows) {
            var arrowMouseOver = function($arrow) {
                $arrow.mouseover(function(event){
                    $arrow.addClass($arrow.classes.over);
                    event.stopImmediatePropagation();
                }).mouseleave(function(event) {
                    $arrow.removeClass($arrow.classes.over);
                    event.stopImmediatePropagation();
                });
            }
            arrowMouseOver(this.$bakArrow);
            arrowMouseOver(this.$fwdArrow);
            
            var arrowMouseDown = function($arrow, dir) {
                return function(event) {
                    $('html').bind('dragstart.jsv selectstart.jsv', function (){ return false; });
                    event.stopImmediatePropagation();
                    $arrow.addClass($arrow.classes.active);
                    
                    self.scrollArrow(dir);
                    var timer;
                    var n = 1;
                    var iterate = function(){
                        self.scrollArrow(dir);
                        timer = setTimeout(iterate, repeatTimers(n++));
                    };
                    timer = setTimeout(iterate, repeatTimers(n++));
                    
                    $arrow.bind('mouseup.jsv', function(){
                        self.$bar.unbind('mouseup.jsv');
                        $('html').unbind('dragstart.jsv selectstart.jsv');
                        clearTimeout(timer);
                        $arrow.removeClass($arrow.classes.active);
                    });
                };
            };
            
            this.$bakArrow.mousedown(arrowMouseDown(this.$bakArrow, -1));
            this.$fwdArrow.mousedown(arrowMouseDown(this.$fwdArrow, +1));
        }
    }
    JScrollBar.prototype.scrollArrow = function(dir) {
        var sp = this.engine.sp(this.$content);
        sp = Math.max(0, sp + dir * 10);
        this.engine.sp(this.$content, sp);
        this.update();
    };

    JScrollBar.prototype.bindMousewheel = function() {
        var self = this;
        this.$container.bind('mousewheel.jsv', function(event, delta){
            self.scrollArrow(-delta);
        });
    }
    JScrollBar.prototype.resize = function(margin) {
        this.margin = margin;
        this.engine.resize(this.$container, this.$scroll, this.$bar, this.$fwdArrow, margin);
        var self = this;
        if (this.auto) {
            var vs = this.engine.vs(this.$container) - margin;
            var cs = this.engine.cs(this.$content);
            if ((cs > vs) && !this.visible) {
                this.$scroll.show();
                this.visible = true;
            } else if ((cs <= vs) && this.visible) {
                this.$scroll.hide();
                this.visible = false;
            }
        } else if (!this.visible) {
            this.$scroll.show();
            this.visible = true;
        }
        this.update();
    }
    JScrollBar.prototype.width = function() {
        if (this.auto) {
            return this.visible ? config.width : 0;
        } else {
            return config.width;
        }
    }
    JScrollBar.prototype.scroll = function(p) {
        var vs = this.engine.vs(this.$container) - this.margin;
        var cs = this.engine.cs(this.$content);
        p = Math.min(p, Math.max(0, cs - vs));
        this.engine.sp(this.$content, p);
        this.update();
    }
    JScrollBar.prototype.update = function() {
        var vs = this.engine.vs(this.$container) - this.margin;
        var bs = this.$fwdArrow ? vs - 2 * config.width : vs;
        var cs = this.engine.cs(this.$content);
        var sp = this.engine.sp(this.$content);
        var hs, hp;
        if (cs <= vs) {
            hs = bs;
            hp = 0;
        } else {
            hs = Math.floor(bs*vs/cs);
            hp = Math.floor(sp*(bs-hs)/(cs-vs));
        }
        if (cs - sp < vs) {
            this.engine.sp(this.$content, Math.floor(Math.max(0, cs - vs)));
        }
        this.engine.hs(this.$handle, hs);
        this.engine.hp(this.$handle, hp);
    }

    function JScrollView($container) {
        this.$container = $container;
        this.$content = $container.children().first();
        this.vScrollBar = config.vertical ? new JScrollBar(this.$container, this.$content, VAL, config.vertical) : JNullBar; 
        this.hScrollBar = config.horizontal ? new JScrollBar(this.$container, this.$content, HAL, config.horizontal) : JNullBar;
        
        // bottom right square
        this.$container.append('<div class="' + classes.square + '" style="display: none; position:absolute;"></div>');
        this.$square = $(this.$container[0].lastChild);
        this.$square.width(config.width);
        this.$square.height(config.width);
        
        if (config.mousewheel) {
            if (config.vertical) {
                this.vScrollBar.bindMousewheel();
            } else {
                this.hScrollBar.bindMousewheel();
            }
        }
        
        this.resize();
    }
    JScrollView.prototype.resize = function() {
        // container or content or both have changed size.
        var vWidth = this.vScrollBar.width();
        var hWidth = this.hScrollBar.width();
        
        this.vScrollBar.resize(hWidth);
        this.hScrollBar.resize(vWidth);
        
        // what if vWidth or hWidth change?
        if ((vWidth != this.vScrollBar.width()) || (hWidth != this.hScrollBar.width())) {
            this.resize();
        } else {
            if (vWidth && hWidth) {
                this.$square.css('left', this.$container.width() - hWidth);
                this.$square.css('top', this.$container.height() - vWidth);
                this.$square.show();
            } else {
                this.$square.hide();
            }
        }
    }
    JScrollView.prototype.scroll = function(v,h) {
        this.vScrollBar.scroll(v);
        this.hScrollBar.scroll((h != undefined) ? h : v);
    }
    
    return this.each(function(){
        var $container = $(this);
        if (!$container.data('jsv')) {
            $container.data('jsv', new JScrollView($container));
        }
    });
}

})(jQuery,this);