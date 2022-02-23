$(() => {

    const textTemplate = document.getElementById('text-template').content.cloneNode(true)
    const text = textTemplate.getElementById('text').innerHTML
    const textId = textTemplate.getElementById('text-id').innerHTML

    let analyzeType = ''

    const container = document.getElementById('sentence-container')
    const syntaxContainer = document.getElementById('syntax-grid')
    const morphologyContainer = document.getElementById('morfology-grid')

    const syntaxButton = document.getElementById('syntax')
    const morfologyButton = document.getElementById('mofology')

    const syntaxCaret = document.getElementById('syntax-caret')
    const morphologyCaret = document.getElementById('morphology-caret')

    const words = text.split(' ')
        .map(s => s.trim())
        .filter(s => s !== "" )

    const syntaxWords = words.map(s => buildWord(s, 'syntax'))
    const morphologyWords = words.map(s => buildWord(s, 'morphology'))

    const analyzer = new Analyzer(syntaxWords, morphologyWords, (text, tags, mode) => {
        console.log(text);
       
        $('#current__word').text(text)
        if (mode == 'syntax') {
            $('#syntax-tags').text(tags.toString())
        }
        else {
            $('#morphology-tags').text(tags.toString())
        }
    })

    function render() {
        container.innerHTML = ""
        
        analyzer.words().forEach(word => {
            container.appendChild(word.element)
        })
    }

    render()

    const syntaxGrid = parse(syntaxContainer, sintaktikButtons, (tag) => {
        analyzer.addTag('syntax', tag)
    })

    const morphologyGrid = parse(morphologyContainer, morfologyButtons, (tag) => {
        try {
            analyzer.addTag('morphology', tag)
        }
        catch(e) {
            console.log(e)
            if (e instanceof TagAlreadyContainsException) {
                $('#morphology-tags')
                    .popup({
                        position: "right center",
                        content: `Tag already exists`,
                        on: 'click'
                    })
                    .popup('show')
            }
        }
    })

    new ButtonGroup([syntaxButton, morfologyButton], button => {
        console.log(button)
        if (button === syntaxButton) {
            $(syntaxGrid).show()
            $(morphologyGrid).hide()
            morphologyCaret.style.visibility = 'hidden'
            syntaxCaret.style.visibility = 'visible'
            analyzeType = 'syntax'
            analyzer.changeMode('syntax')
        }
        else {
            $(syntaxGrid).hide()
            $(morphologyGrid).show()
            morphologyCaret.style.visibility = 'visible'
            syntaxCaret.style.visibility = 'hidden'
            analyzeType = 'morphology'
            analyzer.changeMode('mophology')
        }
        render()
    })
    syntaxButton.onclick(null)

    $('#nav-left').on('click',() => {
        analyzer.prev()
    })

    $('#nav-right').on('click',() => {
        analyzer.next()
    })

    $('#remove-tag').on('click',() => {
        analyzer.removeTag(analyzeType)
    })

    $('#add-word').on('click', () => {
        analyzer.concatWord()
        render()
    })

    $('#split-word').on('click', () => {
        if(analyzer.splitWord()) {
            render()
        }
    })

    $('#show-tags-button').on('click', () => {

        const syntaxWords = collectTags(analyzer.sWords, word => word.tags())
        const morphologyWords = collectTags(analyzer.mWords, word => word.tags())

        $('#modal-syntax-tags').text(syntaxWords)
        $('#modal-morphology-tags').text(morphologyWords)

        $('#show-tags-modal').modal('show')
    })

    $('#commit-button').on('click', () => {


        const isCorrect = analyzer.mWords.every(word => {
            console.log(word);
            return !word.tags.isEmpty
        })
        
        if (isCorrect) {
            const syntaxWords = collectTags(analyzer.sWords ,word => word.tags())
            const morphologyWords = collectTags(analyzer.mWords, word => word.tags())

            const form = document.getElementById('send_form')
            const idInput = document.getElementById('sentence_id')
            const morphInput = document.getElementById('morphology-input')
            const syntaxInput = document.getElementById('syntax-input')

            form.setAttribute('action', '/analyze/')
            idInput.value = textId
            morphInput.value = morphologyWords
            syntaxInput.value = syntaxWords

            console.log(syntaxInput.value)

            console.log(form.getAttribute('action'))

            $(form).submit()
        }
        else {
            $('#warning').modal('show')
        }
    })

    function collectTags(words, predicate) {
        return words.reduce((text, word) => {
            return text + word.codes() + "-"
        }, "")
    }
})

function buildWord(word, mode) {
    const template = document.getElementById('word-template').content.cloneNode(true)
    const element = template.querySelector('.element')
    const span = element.querySelector('.word')
    const indicators = element.querySelector('.indicators')
    const syntax = indicators.querySelector('.red')
    const morphology = indicators.querySelector('.blue')

    const indicator = mode === 'syntax' ? syntax : morphology
    const hiddenIndicator = mode === 'syntax' ? morphology : syntax

    hiddenIndicator.style.display = 'none';
    
    span.innerText = word

    return new Word(element, span, word, new Indicator(indicator))
}