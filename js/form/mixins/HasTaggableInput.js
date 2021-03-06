import LabelSearcher from '../../core/LabelSearcher'

export default {
    data(){
        return {
            inputValue: ''
        }
    },
    computed: {
        $_taggableInputAttributes() {
            return {
                selections: this.$_value || [], 
                multiple: this.$_multiple || false,
                readonly: this.$_readOnly,
                kompoid: this.kompoid,
            }
        },
        $_taggableInputEvents(){
            return {
                click: this.$_click,
                remove: this.$_remove
            }
        },
    },
    methods: {
        $_click(selection){
            if(this.$_readOnly)
                return

            var input = this.$refs.input.$el || this.$refs.input
            input.click()
            input.focus()
            this.inputValue = (new LabelSearcher()).makeBestGuessForLabel(selection)
        },
        $_remove(index) {
            if(this.$_readOnly)
                return
                
            this.$_emptyInput()
            this.component.value.splice( index, 1)
            this.$_blurAction()
            this.$_changeAction()
        },
        $_emptyInput() {
            this.inputValue = ''
        },
    },
}