import KompoAxios from './KompoAxios'
import Alert from './Alert'
import TurboClick from './TurboClick'

export default class Action {
	constructor(action, vue){

        this.actionConfig = action.config
		this.vue = vue
        
        this.warningConfirmed = false

		this.actionType = action.actionType
        this.interactions = action.interactions

        this.$_kAxios = new KompoAxios(this)

	}
    $_config(key){
        return this.actionConfig[key] || null
    }
	run(parameters){
        if(!this.actionType)
            return

		var actionFunction = this.actionType + 'Action'
        this[actionFunction](
            parameters ? parameters.response : null, 
            parameters ? parameters.parentAction : null, 
            parameters ? parameters.payload : null
        ) 
	}
    axiosRequestAction(r, p, payload){
    	this.vue.$_state({ loading: true })
        this.vue.$kompo.vlToggleSubmit(this.vue.kompoid, false) //disable submit while loading

        let additionalPayload = this.$_config('withAllFormValues') ? this.getParentKomposerInfo().jsonFormData : null
        let checkedItemIds = this.vue.$_config('withCheckedItemIds') ? this.getParentKomposerInfo().data : null

        this.$_kAxios.$_actionAxiosRequest(payload, Object.assign(additionalPayload || {}, checkedItemIds || {}))
        .then(r => {

			this.vue.$_state({ loading: false })
            this.vue.$kompo.vlToggleSubmit(this.vue.kompoid, true)

            this.vue.$_runInteractionsOfType(this, 'success', r)


        }).catch(e => {

            this.vue.$_state({ loading: false })

            this.handleErrorInteraction(e)

        })
    }
    submitFormAction(){
        
        this.vue.$_state({ loading: true })
        this.vue.$_state({ isSuccess: false })
        this.vue.$_state({ hasError: false })

        let parentKomposerInfo = this.getParentKomposerInfo()

        if(!parentKomposerInfo.canSubmit){
            setTimeout( () => { this.submitFormAction() }, 100)
            return
        }

        this.vue.$kompo.vlPreSubmit(this.vue.kompoid)

        if(!parentKomposerInfo.url)
            return

        this.$_kAxios.$_submitFormAction(
            parentKomposerInfo.url, 
            parentKomposerInfo.method, 
            parentKomposerInfo.action,
            Object.assign(parentKomposerInfo.jsonFormData, this.$_config('submitPayload') || {})
        )
        .then(r => {

            this.vue.$_state({ loading: false })
            this.vue.$_state({ isSuccess: true })

            this.vue.$kompo.vlSubmitSuccess(this.vue.kompoid, r, this.vue)
            this.vue.$_runInteractionsOfType(this, 'success', r)

        })
        .catch(e => {

            this.vue.$_state({ loading: false })
            this.vue.$_state({ hasError: true })

            if(e.response.status == 449){
                if(_.isString(e.response.data)){
                    if(confirm(e.response.data)){
                        this.warningConfirmed = true
                        this.submitFormAction()
                    }
                }else{
                    this.fillModalAction(e.response, () => {
                        this.warningConfirmed = true
                        this.submitFormAction()
                    })
                }
            }else{
                this.vue.$kompo.vlSubmitError(this.vue.kompoid, e)

                if (e.response.status !== 422) //handled in vlSubmitError
                    this.handleErrorInteraction(e)
            }
            
        })
    }
    browseQueryAction(){
        this.runKompoInfoSpecifications('$_browseMany', 'vlLoadItems')
    }
    refreshKomposerAction(){
        this.runKompoInfoSpecifications('$_refreshMany', 'vlRefreshKomposer', true)
    }
    sortQueryAction(){
        this.vue.$_state({ 
            activeSort: true,
            loading: true
        })
        if(this.vue.customBeforeSort)
            this.vue.customBeforeSort()

        this.vue.$kompo.vlSort(this.vue.kompoid, this.vue.$_sortValue, this.vue.$_elKompoId)
    }
    emitFromAction(response){
        this.vue.$_vlEmitFrom(this.$_config('event'), this.getPayloadFor('emitPayload'))

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    emitDirectAction(response){
        let emitPayload = _.isEmpty(this.getPayloadFor('emitPayload')) ? null : this.getPayloadFor('emitPayload')

    	this.vue.$emit(this.$_config('event'), emitPayload  || (response ? response.data : null))

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    toggleElementAction(){
        if(this.$_config('toggleId')){
            this.vue.$kompo.vlToggle(this.vue.kompoid, this.$_config('toggleId'))
        }
        
        this.vue.$_runInteractionsOfType(this, 'success')
    }
    hideSelfAction(){
        this.vue.$_toggleSelf()
    }
    runJsAction(response){
        const jsFunction = this.$_config('jsFunction')
        this.vue.$nextTick(() => { //yep, run it if you find it
            
            if(window[jsFunction])
                window[jsFunction](response) 

            if(this.vue[jsFunction]) //never used yet but maybe one day. The idea is interesting
                this.vue[jsFunction](response) 
        })
    }
    scrollToAction(){
        var VueScrollTo = require('vue-scrollto')
        setTimeout(() => this.vue.$scrollTo(
            this.$_config('scrollSelector'), 
            this.$_config('scrollDuration'), 
            this.$_config('scrollOptions'), 
        ), this.$_config('timeoutDuration') || 500)
    }
    toggleClassAction(){
        this.vue.$_toggleClass(this.$_config('toggleClass'))

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    addClassAction(){
        this.vue.$_addClass(this.$_config('addClass'))

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    removeClassAction(){
        this.vue.$_removeClass(this.$_config('removeClass'))

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    removeSelfAction(){
        this.vue.$kompo.vlRemoveItem(this.vue.kompoid, this.vue.index)

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    setHistoryAction(){
        let historyUrl = this.$_config('setHistory')
        window.history.pushState({url: historyUrl}, "", historyUrl)
        window.onpopstate = function(e) {location.reload()} //for back button

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    fillModalAction(response, confirmFunc){
    	var modalName = this.$_config('modalName') || (this.vue.kompoid ? 'modal'+this.vue.kompoid : 'vlDefaultModal')
        var panelId = this.$_config('panelId') || (this.vue.kompoid ? 'modal'+this.vue.kompoid : 'vlDefaultModal')

        this.vue.$kompo.vlModalShow(modalName, true, this.vue.$_config('warnBeforeClose'), confirmFunc)

        this.vue.$nextTick( () => {
        	this.vue.$kompo.vlFillPanel(panelId, response.data.message || response.data)
        })
    }
    closeModalAction(response){
        this.vue.$kompo.vlModalClose('modal'+this.$_config('closeModalName'))

        this.vue.$_runInteractionsOfType(this, 'success')
    }
    modalInsertAction(response){
        this.vue.$kompo.vlModalInsert(
            this.vue.kompoid, 
            {
                vkompo: response.data,
                is: 'VlEditLinkModalContent',
                index: this.vue.index,
                kompoid: this.vue.kompoid,
                keepModalOpen: this.vue.$_config('keepModalOpen')
            }, 
            {
                warn: this.vue.$_config('warnBeforeClose')
            }
        )
    }
    fillPanelAction(response, parentAction){
        this.vue.$kompo.vlFillPanel(this.$_config('panelId'), response.data, this.$_config('included') || parentAction.$_config('included'))
        
        this.vue.$_runInteractionsOfType(this, 'success')
    }
    fillSlidingPanelAction(response){
        this.vue.$kompo.vlFillSlidingPanel(response)
    }
    closeSlidingPanelAction(){
        this.vue.$kompo.vlCloseSlidingPanel()
    }
    fillPopupAction(response){
        this.vue.$kompo.vlFillPopup(response)
    }
    addAlertAction(){
        new Alert().asObject(this.$_config('alert')).emitFrom(this.vue)
    }
    fillAlertAction(response){
        new Alert().asObject({
            ...this.$_config('alert'),
            message: response.data
        }).emitFrom(this.vue)
    }
    redirectAction(response){
    	if(this.$_config('redirectUrl') === true){
            setTimeout( () => { this.redirect(response.request.responseURL) }, 300)
        }else if(this.$_config('redirectUrl')){
            setTimeout( () => { this.redirect(this.$_config('redirectUrl')) }, 300)
        }
    }

    /* internal */
    redirect(url){
        if(this.vue.component && this.vue.component.turbo){
            new TurboClick(this.vue.$vnode, url).trigger()
        }else{
            window.location.href = url
        }
    }
    getPayloadFor(payloadKey) {
        return Object.assign(
            this.$_config(payloadKey) || {}, 
            this.vue.$_getJsonValue || {} 
        )
    }
    getFormData(jsonFormData) {
        var formData = new FormData()
        for ( var key in jsonFormData ) {
            formData.append(key, jsonFormData[key])
        }
        if(this.warningConfirmed)
            formData.append('kompoConfirmed', this.warningConfirmed)
        return formData
    }
    handleErrorInteraction(e){
        if(this.vue.$_hasInteractionsOfType(this, 'error')){
           this.vue.$_runInteractionsOfType(this, 'error', e)
        }else{
           this.$_kAxios.$_handleAjaxError(e) 
        }
    }
    getParentKomposerInfo(kompoid, resetFilters){

        let usedKompoId = kompoid || this.vue.kompoid

        this.vue.$kompo.vlRequestKomposerInfo(usedKompoId, this.vue.$_elKompoId, {
            page: this.$_config('page'), 
            resetFilters: resetFilters,
        })

        return this.vue.parentKomposerInfo[usedKompoId]
    }

    /* utils */
    getAsArray(data, fallback){
        return data ? (_.isArray(data) ? data : [data]) : [fallback]
    }

    getKompoInfoSpecifications(resetFilters){

        var specifications = []

        this.getAsArray(this.$_config('kompoid'), this.vue.kompoid).forEach(kompoid => {

            if(!kompoid)
                return

            let parentKomposerInfo = this.getParentKomposerInfo(kompoid, resetFilters)

            if(parentKomposerInfo)
                specifications.push({
                    kompoid: kompoid,
                    data: Object.assign(parentKomposerInfo.data || {}, this.$_config('ajaxPayload') || {}),
                    kompoinfo: parentKomposerInfo.kompoinfo,
                    page: parentKomposerInfo.page,
                    sort: parentKomposerInfo.sort,
                })
        })

        return specifications
    }

    runKompoInfoSpecifications(axiosRequestFunc, komposerFillFunc, resetFilters){

        this.vue.$_state({ loading: true })

        let specifications = this.getKompoInfoSpecifications(resetFilters)

        if(!specifications.length){
            this.vue.$_state({ loading: false })
            return
        }

        this.$_kAxios[axiosRequestFunc](this.$_config('route'), specifications)
            .then(r => {

                this.vue.$_state({ loading: false })

                Object.keys(r.data).forEach((kompoid) => {
                    this.vue.$kompo[komposerFillFunc](kompoid, r.data[kompoid])
                })

                this.vue.$_runInteractionsOfType(this, 'success')

            }).catch(e => {

                this.vue.$_state({ loading: false })

                this.handleErrorInteraction(e)

            })
    }
}