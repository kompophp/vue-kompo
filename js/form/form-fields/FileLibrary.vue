<template>
    <vl-form-field v-bind="$_wrapperAttributes">

        <vlTaggableInput 
            v-bind="$_taggableInputAttributes" 
            v-on="$_taggableInputEvents"
            :labelKey="labelKey">
            <div class="vlFormControl">
                <input
                    v-bind="$_attributes"
                    v-on="$_events"
                    type="file"
                    ref="input" />
            </div>
            <template v-slot:icon>
                <i class="icon-upload"/>
            </template>
        </vlTaggableInput>

        <modal :name="'modal-'+$_elKompoId">
            
            <vl-thumbnail-gallery 
                :images="options || []" 
                :selected="[]"
                @remove="remove" />

        </modal>

    </vl-form-field>
</template>

<script>
import FieldImage from '../mixins/FieldImage'
import HasTaggableInput from '../mixins/HasTaggableInput'

export default {
    mixins: [FieldImage],
    data(){
        return {
            labelKey: 'name'
        }
    },
    methods: {
        addFile(){
            this.$_makeFileImages()
        },
        options(){
            return this.component.options
        },
    }
}
</script>