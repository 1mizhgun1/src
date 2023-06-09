const express = require('express');
const { fetcher } = require('./fetcher.js');

/*
    TODO: краулер страницы
    POST http://localhost:3000/parse
    body: { domainName: string}
    return string[]
*/

const app = express();
const host = 'localhost';
const port = 3000;

const url = "https://test.com/"

async function findSRC(url) {
    const response = await fetcher(url)
    let result = new Array()
    const status = await response.status
    if (status !== 200) {
        /*console.log(`
            url = "${url}"
            status = ${status}
        `)*/
        return result
    }
    const html_code = await response.text()
    for (let i = 0; i < html_code.length - 6; i++) {
        if (html_code[i] == 'a' && html_code[i + 1] == ' ' && html_code[i + 2] == 'h' && html_code[i + 3] == 'r' && html_code[i + 4] == 'e' && html_code[i + 5] == 'f') {
            let start = i + 4
            while (html_code[start] != '"') {
                start++
            }
            start += 1
            let end = start
            while (html_code[end] != '"') {
                end++
            }
            const src = html_code.slice(start, end)
            result.push(src)
        }
    }
    return result
}

async function getUrlJSON(url) {
    let result = { body: { domainName: url }, returns: [] }
    await findSRC(url).then((urls) => {
        result.returns = urls
    })
    return result
}

async function parse(root) {
    let result = new Array()
    let stack = new Array()
    let processed = new Array()
    stack.push(root)
    while (stack.length > 0) {
        const curr = stack[0]
        await getUrlJSON(curr).then((data) => {
            result.push(data)
            for (let i = 0; i < data.returns.length; i++) {
                if (!stack.includes(data.returns[i]) && !processed.includes(data.returns[i]) && data.returns[i] !== curr) {
                    stack.push(data.returns[i])
                }
                //console.log(`${curr}  >>>  ${data.returns[i]}`)
            }
            stack.splice(0, 1)
            processed.push(curr)
        })
    }
    return result
}

app.get('/', (request, response) => {
    response.send(`
        <h2>Переходите на страницу parse:</h2>
        <a href="http://localhost:3000/parse"><h2>http://localhost:3000/parse</h2></a>
    `)
})

app.get('/parse', (request, response) => {
    parse(url).then((result) => {
        response.send(result)
        //console.log(result)
    })
})

app.listen(port, host, (error) => {
    if (error) {
        return console.log('Ошибка запуска сервера!')
    }

    console.log(`Сервер запущен по адресу http://${host}:${port}`);
});