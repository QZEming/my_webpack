const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')
const md5 = require('md5')

let ID = 0

// 读取文件的函数
function readSrcFile(fileName) {
    // 文件内容
    const fileContent = fs.readFileSync(fileName, 'utf-8');
    const ast = parser.parse(fileContent, {
        sourceType: 'module'
    })

    // 找出依赖文件 
    // 声明存储依赖文件的数组
    const dependences = [];

    // 传入参数，第一个为要解析的ast树，第二个为一个对象，每个属性对应一个钩子，可以让我们对ast里面对应的节点进行操作
    traverse(ast, {
        ImportDeclaration: ({ node }) => {
            dependences.push(node.source.value);
        }
    })

    // 从ast转换为ES5代码
    const { code } = babel.transformFromAstSync(ast, null, {
        presets: ['@babel/preset-env']
    })

    let id = ID++;

    return {
        id,
        fileName,
        dependences,
        code
    }
}

// 从文件入口对依赖文件处理
function handleFiles(fileName) {
    // 获取入口文件处理后的对象
    const fileObj = readSrcFile(fileName);
    const list = [fileObj];
    for (const asset of list) {
        // 使用path获取asset.fileName文件所在的文件夹
        const dirname = path.dirname(asset.fileName);
        // 为了在后面能通过id找到模块，设置一个map
        asset.mapping = {};
        // 遍历队列
        asset.dependences.forEach(relativePath => {
            // 将上面得到的文件夹路径和相对路径拼接起来得到绝对路径
            const absolutePath = path.join(dirname, relativePath);
            // 将依赖的文件使用readSrcFile处理
            const child = readSrcFile(absolutePath);
            // 将对应模块的id传入到mapping中
            asset.mapping[relativePath] = child.id;
            // 将依赖的文件添加到队列尾部
            list.push(child);
        });
    }
    return list;
}


// 构建最终的bundle.js文件的内容
function bundle(graph) {
    let modules = ''

    graph.forEach(mod => {
        modules += `
            ${mod.id}:[
                function (require,module,exports){
                    ${mod.code}
                },
                ${JSON.stringify(mod.mapping)}
            ],
        `
    })

    // 在内部构建require来通过id获取到模块内容
    // 而在require函数内部，由于fn里面的内容是通过相对路径来进行文件/模块获取的
    // 所以还需要在里面写入另一个函数localRequire来对路径做处理
    // 因为以我们上面的形式处理，id是从0开始的，require(0)就是从入口文件执行
    const result = `
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
        })({${modules}})
    `;

    return result;
}

const filePath = './src/'
const previousMd5s = {}
let timmer = null

console.log(`正在监听 ${filePath} 下的文件`);
// 传入{ recursive: true } 表示监听目录下的所有子目录
fs.watch(filePath, { recursive: true }, (event, filename) => {
    // 防抖处理
    clearTimeout(timmer)
    timmer = setTimeout(() => {
        // 判断filename是否可用且eventType是否为改变
        if (filename && event == 'change') {
            // 生成一个md5值
            let currentMd5 = md5(fs.readFileSync(filePath + filename))
                // 如果md5的值和之前一样，就return出去
            if (currentMd5 == previousMd5s[filename]) {
                return
            }
            previousMd5s[filename] = currentMd5
            console.log(`${filename}文件发生更新`)
            console.log('重新打包文件')

            const graph = handleFiles('./src/index.js')
            const result = bundle(graph)

            console.log('文件打包完成')
            fs.writeFileSync('./dist/bundle.js', result)
            console.log('文件已写入新生成的bundle.js')

        }
    }, 500)
})