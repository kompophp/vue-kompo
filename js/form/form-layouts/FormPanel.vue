<template>
    <vl-panel 
        v-show="!$_hidden" 
        v-bind="$_layoutWrapperAttributes"
        @includeObj="includeObject"
        @loaded="destroyPanel">

        <div v-if="komponents.length" class="h-full"><!-- had to wrap in a div for transition -->
            <template v-for="(row,index) in komponents">
                <component 
                    v-bind="$_attributes(row)" 
                    @closePanel="destroyPanel"/>
            </template>
        </div>


    </vl-panel>
</template>

<script>
import Layout from '../mixins/Layout'
export default {
    mixins: [Layout],
    computed:{
        $_customLayoutAttributes(){
            return {
                transition: this.$_config('transition'),
                mode: this.$_config('transitionMode'),
                closable: this.$_config('closable'),
            }
        },
        hidesOnLoad(){
            return this.component.$_config('hidesOnLoad') // this.$_config(...) not working... ??
        }
    },
    methods:{
        destroyPanel(){
            //this.$delete(this.komponents, 0)
            this.komponents = []
        },
        loadPanel(komponents){
            
            //TODO: append or replace komponents...
            
            if(!_.isArray(komponents) && !_.isObject(komponents))
                return //should be object or array. If not, it's dump most probably

            komponents = _.isArray(komponents) ? komponents : [komponents]

            this.komponents.push(... komponents) //set reactively
        },
        revertPanel(){
            this.$_togglesForm(this.hidesOnLoad)
            this.destroyPanel()
        },
        includeObject(object){
            this.destroyPanel()
            this.$nextTick( () => {
                this.loadPanel(object)
                this.$nextTick( () => { this.$_togglesForm(this.hidesOnLoad) })
            })
        }
    },
    created() {

        this.komponents = this.komponents || [] //when called in Vue directly (not through a PHP Form)
        
        this.loaded = this.komponents && this.komponents.length
    }
}
</script>
