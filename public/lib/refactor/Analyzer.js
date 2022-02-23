class Analyzer {

    mode = 'syntax'
    sWords
    mWords
    callback
    mList
    sList

    constructor(sWords, mWords, callback) {
        this.sWords = sWords
        this.mWords = mWords

        this.callback = callback
        this.sList = new CircularList(sWords)
        this.mList = new CircularList(mWords)

        this.modeMap = {
            syntax: this.sList,
            mophology: this.mList
        }

        this.sList.current().toggle()
        this.mList.current().toggle()

        this.changeMode('syntax')
    }

    changeMode(mode) {
        this.mode = mode
        this.sendCallback()
    }

    list() {
        return this.modeMap[this.mode]
    }

    words() {
        if (this.mode == 'syntax') {
            return this.sWords
        }
        else {
            return this.mWords
        }
    }

    prev() {
        this.list().current().toggle()
        this.list().prev().toggle()

        this.sendCallback()
    }

    current() {
        return this.list().current()
    }

    concatWord() {
        const word = this.list().current()
        const next = this.list().peek(1)
        if (next !== undefined) {
            word.concat(next)
            this.list().removeNext()
            this.sendCallback()
        }
    }

    splitWord() {
        const word = this.list().current()
        const inner = word.split()
        if (inner) {
            this.list().insertNext(inner)
        }
        this.sendCallback()
        return inner !== undefined
    }

    next() {
        this.list().current().toggle()
        this.list().next().toggle()
        this.sendCallback()
    }

    addTag(type, tag) {
        this.list().current().add(type, tag)
        this.sendCallback()
    }

    removeTag(type) {
        this.list().current().remove(type)
        this.sendCallback()
    }

    sendCallback() {
        const word = this.list().current()
        this.callback(word.display, word.tags, this.mode)
    }
}