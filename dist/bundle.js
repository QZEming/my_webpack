
        (function(modules){
            function require(id){
                const [fn,mapping] = modules[id];

                function localRequire(relativePath){
                    return require(mapping[relativePath]);
                }

                const module = {
                    exports:{}
                }

                fn(localRequire , module , module.exports);

                return module.exports;
            }
            require(0)
        })({
            0:[
                function (require,module,exports){
                    "use strict";

var _text = require("./text1.js");

var _text2 = require("./text2.js");

console.log(1);
console.log("text1:".concat(_text.text1, "   text2:").concat(_text2.text2));
                },
                {"./text1.js":1,"./text2.js":2}
            ],
        
            1:[
                function (require,module,exports){
                    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.text1 = void 0;

var _text = require("./text3.js");

var text1 = "text1 ".concat(_text.text3);
exports.text1 = text1;
                },
                {"./text3.js":3}
            ],
        
            2:[
                function (require,module,exports){
                    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.text2 = void 0;
var text2 = 'text2';
exports.text2 = text2;
                },
                {}
            ],
        
            3:[
                function (require,module,exports){
                    "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.text3 = void 0;
var text3 = 'text3';
exports.text3 = text3;
                },
                {}
            ],
        })
    