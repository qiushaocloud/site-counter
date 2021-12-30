module.exports = {
    'root': true,
    'env': {
        'node': true,
        'browser': false,
        'es6': true
    },
    'parser': '@typescript-eslint/parser',
    'extends': [
        'eslint:recommended',
        'prettier'
    ],
    "plugins": ['@typescript-eslint'],//定义了该eslint文件所依赖的插件
    'parserOptions': {
        'project': 'tsconfig.json',
        'tsconfigRootDir': __dirname,
        'ecmaVersion': 6
    },
    'rules': {
        'indent': [  //强制使用一致的缩进：tab
            'error',
            2,
            {
                'SwitchCase': 1
            }
        ],
        // "linebreak-style": [ //强制使用Windows行结束符：\r\n
        //     "error",
        //     "windows"
        // ],
        'quotes': [  //强制使用单引号
            'error',
            'single'
        ],
        'semi': [ //在语句结尾需要分号
            'error',
            'always'
        ],
        "no-extra-parens":0, //禁止在任何表达式周围使用不必要的括号
        'no-console': 2, //禁止使用console相关方法
        'eqeqeq': 2, //在任何情况下强制使用===和!==
        'valid-jsdoc':0, //强制使用有效的 JSDoc 注释
        'no-alert':2, //禁用 alert、confirm 和 prompt
        'no-caller':2, //禁用 arguments.caller 或 arguments.callee
        'no-else-return':2, //禁止 if 语句中 return 语句之后有 else 块
        'no-empty-function':2, //禁止出现空函数
        'no-eval':2, //禁用 eval()
        'no-invalid-this': 2,//禁止无效的this，只能用在构造器，类，对象字面量
        'no-catch-shadow': 2,//禁止catch子句参数与外部作用域变量同名
        'no-class-assign': 2,//禁止给类赋值
        'no-cond-assign': 2,//禁止在条件表达式中使用赋值语句
        'no-const-assign': 2,//禁止修改const声明的变量
        'no-constant-condition': 2,//禁止在条件中使用常量表达式 if(true) if(1)
        'no-control-regex': 2,//禁止在正则表达式中使用控制字符
        'no-debugger': 2,//禁止使用debugger
        'no-dupe-keys': 2,//在创建对象字面量时不允许键重复 {a:1,a:1}
        'no-dupe-args': 2,//函数参数不能重复
        'no-duplicate-case': 2,//switch中的case标签不能重复
        'no-empty': 2,//块语句中的内容不能为空
        'no-empty-character-class': 2,//正则表达式中的[]内容不能为空
        'no-ex-assign': 2,//禁止给catch语句中的异常参数赋值
        'strict': 2,//使用严格模式
        'use-isnan': 2,//禁止比较时使用NaN，只能用isNaN()
        'no-use-before-define': 2,//未定义前不能使用
        'no-unused-vars': [2, {'vars': 'all', 'args': 'after-used'}],//不能有声明后未被使用的变量或参数
        'no-useless-call': 2,//禁止不必要的call和apply
        'no-void': 2,//禁用void操作符
        'no-script-url': 0,//禁止使用javascript:void(0)
        'no-self-compare': 2,//不能比较自身
        'no-sequences': 0,//禁止使用逗号运算符
        'no-shadow': 2,//外部作用域中的变量不能与它所包含的作用域中的变量或参数同名
        'no-shadow-restricted-names': 2,//严格模式中规定的限制标识符不能作为声明时的变量名使用
        'max-len': [ //强制行的最大长度
            'error',
            {
                'code': 200,  //强制行的最大长度
                'tabWidth': 4, //指定 tab 字符的宽度
                'ignoreComments': true, // 忽略所有拖尾注释和行内注释
                'ignoreTrailingComments': true, //忽略拖尾注释
                'ignoreUrls': true, //忽略含有链接的行
                'ignoreStrings': true, //忽略含有双引号或单引号字符串的行
                'ignoreTemplateLiterals': true, //忽略包含模板字面量的行
                'ignoreRegExpLiterals': true, //忽略包含正则表达式的行
            }
        ],
        'max-lines':[ //强制文件的最大行数
            'error',
            {
                'max':300, //(默认 300) 强制一个文件的最大行数
                'skipBlankLines': true, //忽略空白行
                'skipComments': true, //忽略只包含注释的行
            }
        ],
        /*"multiline-comment-style": [
            "error",
            "bare-block", //不允许连续的行注释支持块注释，并且不允许块注释"*"在每行之前具有字符
        ],*/
        'no-multi-assign':2, //禁止连续赋值
        'no-multiple-empty-lines': [ //不允许多个空行
            'error',
            {
                'max': 2, //强制最大连续空行数
                'maxEOF': 1, //强制文件末尾的最大连续空行数
                'maxBOF':1, //强制文件开始的最大连续空行数
            }
        ],
        'no-nested-ternary':2, //禁止使用嵌套的三元表达式
        'no-trailing-spaces':2, //禁用行尾空白
        'no-unneeded-ternary':2, //禁止可以在有更简单的可替代的表达式时使用三元操作符
        'no-whitespace-before-property':2, //禁止属性前有空白
        'arrow-body-style':[ //要求箭头函数体使用大括号
            'error',
            'always'
        ],
        'no-duplicate-imports':2, //禁止重复模块导入
        'no-var':2, //要求使用 let 或 const 而不是 var
        'prefer-const':2, //要求使用 const 声明那些声明后不再被修改的变量
        '@typescript-eslint/consistent-type-definitions': 2, //Consistent with type definition either interface or type
        '@typescript-eslint/no-unsafe-member-access': 0, //Disallows member access on any typed variables
        '@typescript-eslint/no-explicit-any': 0, //Disallow usage of the any type
        '@typescript-eslint/no-unsafe-call': 0, //Disallows calling an any type value
        '@typescript-eslint/naming-convention': 2, //Enforces naming conventions for everything across a codebase
        '@typescript-eslint/restrict-plus-operands': 0, //When adding two variables, operands must both be of type number or of type string. (restrict-plus-operands from TSLint)
        "comma-style": [2, "last"], // 逗号风格，换行时在行首还是行尾
        "complexity": [0, 3], //循环复杂度
        "newline-after-var": 0, //变量声明后是否需要空一行
        "operator-linebreak": [2, "before"], //换行时运算符在行尾还是行首
        "strict": 2, //使用严格模式
        'keyword-spacing': 2, //强制在关键字前后使用一致的空格
        'space-before-function-paren': 2, //强制在 function的左括号之前使用一致的空格
        'array-bracket-spacing': 2,	//强制数组方括号中使用一致的空格
        'block-spacing': 2,	//强制在单行代码块中使用一致的空格
        'comma-spacing': 2,	//强制在逗号前后使用一致的空格
        'computed-property-spacing': 2,	//强制在计算的属性的方括号中使用一致的空格
        'object-curly-spacing': 2,	//强制在花括号中使用一致的空格
        'semi-spacing': 2,	//强制分号之前和之后使用一致的空格
        'space-before-blocks': 2,	//强制在块之前使用一致的空格
        'space-in-parens': 2,	//强制在圆括号内使用一致的空格
        'space-infix-ops': 2,	//要求操作符周围有空格
        'space-unary-ops': 2,	//强制在一元操作符前后使用一致的空格
        'spaced-comment': 2,	//强制在注释中 // 或 /* 使用一致的空格
        'require-jsdoc': 2, //要求使用 JSDoc 注释
        'brace-style': 2 //强制在代码块中使用一致的大括号风格
    }
};