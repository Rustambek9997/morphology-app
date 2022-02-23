const express = require('express')
const router = express.Router()
const xml2js = require('xml2js');

const authService = require('../data/services/AuthorizeService')
const analyzeService = require('../data/services/AnalyzeService')
const sentenceService = require('../data/services/SentenceService')
const UserData = require("../data/models/UserData");
const Sentence = require("../data/models/Sentence");

router.get('/', async (req, res) => {

    let userData;

    try {
        const auth = await authService.authorize(req.session.token)
        userData = new UserData(auth.user.name, auth.isAdmin)
    }
    catch (ex) {
        userData = undefined
    }

    res.render('manage', {
        title: 'Manage',
        user: userData,
        layout: 'index'
    })
})

router.get('/all', async (req, res) => {

    const page = req.query.p ? req.query.p : (req.session.page ? req.session.page : 1)

    req.session.page = page

    let userData;

    try {
        const auth = await authService.authorize(req.session.token)
        userData = new UserData(auth.user.name, auth.isAdmin)
    }
    catch (ex) {
        userData = undefined
    }

    const sentences = await sentenceService.findAll(page - 1)
    const pages = await sentenceService.pages(page)

    const paging = pages.length > 0 ? {
        pages: pages,
        start: pages[0].number,
        end: pages[pages.length - 1].number
    } : undefined

    res.render('all-sentences', {
        title: 'All Sentences',
        user: userData,
        sentences: sentences,
        paging: paging,
        layout: 'index'
    })
})

router.get('/delete/:id', async (req, res) => {
    await sentenceService.remove(req.params.id)
    res.redirect('/sentence/manage/all')
})

router.get('/delete_all', async (req, res) => {
    await sentenceService.removeAll()
    res.redirect('/sentence/manage/all')
})

router.post('/upload', async (req, res) => {
    const file = req.files.text
    const content = file.data.toString()

    try {
        console.log(content);
        const xml = await xml2js.parseStringPromise(content)
        const textes = xml.corpus.text

        for (let i = 0; i < textes.length; i++) {
            const elem = textes[i];
            const text = elem.content[0]._

            const sentences = text.split('.')
                .map(s => s.trim())
                .filter(s => s !== "")

            for (let j = 0; j < sentences.length; j++) {
                const element = sentences[j];
                const sentence = new Sentence(-1, element)
                await sentenceService.addSentence(sentence)
            }
        }
    }
    catch (ex) {
        console.log(ex)
    }
    res.redirect('/sentence/manage')
})


router.get('/download/:id', async (req, res) => {
    try {
        const sentence = await sentenceService.findById(req.params.id)

        const text = await buildSentence(sentence)

        res.attachment(`sentence${sentence.id}.txt`)
        res.type('txt')
        res.send(text)
    }
    catch(ex) {
        console.log(ex);
        res.send(ex)
    }
})

router.get('/download-all', async (req, res) => {

    try {
        const allSentences = await sentenceService.findAll()

        let all = ""
    
        for (let i = 0; i < allSentences.length; i++) {
            const element = allSentences[i];
            all += await buildSentence(element)
        }
    
        res.attachment(`dump${new Date()}.txt`)
        res.type('txt')
        res.send(all)
    }
    catch(ex) {
        res.send(ex)
    }
})


router.get('/download-all-xml', async (req, res) => {

    try {
        const allSentences = await sentenceService.findAll()

        let all = `<?xml version="1.0" encoding="UTF-8"?>\n`+
                  `<corpus name="morphology-app">\n`
    
        for (let i = 0; i < allSentences.length; i++) {
            const element = allSentences[i];
            all += await buildSentenceXML(element)
        }
        
        all+= "</corpus>"

        res.attachment(`xml-dump${new Date()}.xml`)
        res.type('xml')
        res.send(all)
    }
    catch(ex) {
        res.send(ex)
    }
})

async function buildSentenceXML(sentence) {
    const analyzes = await analyzeService.allAnalyzes(sentence.id)

    let xml = `\t<text id="${sentence.id}" type="" style="">\n` +
              `\t\t<content>${sentence.text}</content>\n`;

    for (let i = 0; i < analyzes.length; i++) {
        const element = analyzes[i];
        
        xml += "\n\t\t<tagged>\n"
        xml += `\t\t\t<author>${element.user}</author>\n`
        xml += `\t\t\t<morphology>${element.morph}</morphology>\n`
        xml += `\t\t\t<syntax>${element.syntax}</syntax>\n`
        xml += "\t\t</tagged>\n"
    }

    xml += `\t</text>\n\n`

    return xml
}

async function buildSentence(sentence) {

    const analyzes = await analyzeService.allAnalyzes(sentence.id)

    let text = `#${sentence.id} ${sentence.text}\n`

    let analyzeText = ""

    for (let i = 0; i < analyzes.length; i++) {
        const element = analyzes[i];
        analyzeText += `author: ${element.user}\n`;
        analyzeText += `m: ${element.morph}\n`;
        analyzeText += `s: ${element.syntax}\n`;
    }

    text += analyzeText + "\n"
    
    return text
}

router.get('/structure', async (req, res) => {

    const file = `${__dirname}/../public/structure.xml`;
    res.download(file); // Set disposition and send it.
})

router.post('/', async (req, res) => {
    try {

        const text = req.body.text

        const sentences = text.split('.')
            .map(s => s.trim())
            .filter(s => s !== "");

        for (let j = 0; j < sentences.length; j++) {
            const element = sentences[j];
            const sentence = new Sentence(-1, element)
            await sentenceService.addSentence(sentence)
        }
    }
    catch (ex) {
        console.log(ex)
    }
    res.redirect('/sentence/manage')
})

module.exports = router