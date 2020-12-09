import './tab-panes.scss'
import {resolveStaticPath} from '../helper'

function _noop() {}
const DEFAULT_OPTIONS = {
	onTabChange: _noop,
	onTabRemove: _noop,
	onTabAdd: _noop,
	parent: document.body,
	defaultActive: 'title',
	tabListClassName: 'tab-list'
}

import * as _ from 'lodash-es'
import {
	addEvent
} from '../helper'
export default class TabPanes {
	constructor(options) {
		this.tabs = []
		this.tabsContainerEl = null
		this.panesContainerEl = null
		this.options = _.merge({}, DEFAULT_OPTIONS, options)
		this.init()
	}
	init() {
		var {
			parent,
			tabListClassName
		} = this.options
		var tabPanesWrapper = document.createElement('div')
		tabPanesWrapper.setAttribute('class', 'tab-panes-container-wrapper')
		parent.appendChild(tabPanesWrapper)

		this.tabsContainerEl = document.createElement('ul')
		this.tabsContainerEl.setAttribute('class', `${tabListClassName} clearfix`)
		tabPanesWrapper.appendChild(this.tabsContainerEl)

		this.panesContainerEl = document.createElement('div')
		this.panesContainerEl.setAttribute('class', 'panes-container-box')
		tabPanesWrapper.appendChild(this.panesContainerEl)
	}
	add({
		tab = {
			name: 'name',
			title: 'title'
		},
		pane = null
	}) {
		if (!pane) {
			throw new Error('添加tab失败！<缺少Pane Dom>')
		}
		tab.id = _.uniqueId()
		this.tabs.push(tab)
		this.tabsContainerEl.appendChild(this.buildTabEl(tab))

		var tabPaneWrapperEl = this.buildTabPaneWrapperEl(tab)
		this.panesContainerEl.appendChild(tabPaneWrapperEl)
		tabPaneWrapperEl.appendChild(pane)

		// if (!this.getCurrentActiveTab()) {
		//     tab.isActive = true
		//     this.setActiveTab(tab)
		// }
	}
	buildTabEl(tab) {
		var tabEl = document.createElement('li');
		tabEl.setAttribute('class', 'tab-list-item');
		tabEl.setAttribute('id', `tab-${tab.id}`);

		tabEl.innerHTML = (tab.icon ? `<img class="tab-icon" src="${resolveStaticPath(tab.icon)}" alt="${tab.title}" />`: '') + `<span>${tab.title}</span>`;

		addEvent(tabEl, 'click', (e) => {
			var target = e.target || e.srcElement;
			if (/is\-active/.test(target.className)) {
				return;
			}
			this.setActiveTab(tab);
			this.options.onTabChange.call(this, tab);
		}, false)

		return tabEl;
	}
	buildTabPaneWrapperEl(tab) {
		var tabPaneWrapperEl = document.createElement('div')
		tabPaneWrapperEl.setAttribute('class', 'tab-pane-wrapper')
		tabPaneWrapperEl.setAttribute('id', `tab-pane-wrapper-${tab.id}`)

		return tabPaneWrapperEl
	}
	setActiveTab(activeTab) {
		var currActiveTab = this.getCurrentActiveTab()
		var newActiveTab = this.findTab(activeTab)
		// if (currActiveTab === newActiveTab) {
		//     return
		// }
		if (currActiveTab) {
			currActiveTab.isActive = false
			let currActiveTabEl = this.tabsContainerEl.querySelector(`#tab-${currActiveTab.id}`)
			currActiveTabEl.setAttribute('class', currActiveTabEl.className = 'tab-list-item')
// 			currActiveTabEl.setAttribute('class', currActiveTabEl.className.replace(/\s*is\-active/, ''))
			let currActiveTabPaneEl = this.panesContainerEl.querySelector(`#tab-pane-wrapper-${currActiveTab.id}`)
			currActiveTabPaneEl.setAttribute('style', 'display: none')
		}
		if (newActiveTab) {
			newActiveTab.isActive = true
			let newActiveTabEl = this.tabsContainerEl.querySelector(`#tab-${newActiveTab.id}`)
			newActiveTabEl.setAttribute('class', newActiveTabEl.className.replace(/$/, ' is-active'))
			if (!newActiveTabEl.previousSibling) {
				newActiveTabEl.setAttribute('class', newActiveTabEl.className.replace(/$/, ' is-first-active'))
			}
			if (!newActiveTabEl.nextSibling) {
				newActiveTabEl.setAttribute('class', newActiveTabEl.className.replace(/$/, ' is-last-active'))
			}

			let newActiveTabPaneEl = this.panesContainerEl.querySelector(`#tab-pane-wrapper-${newActiveTab.id}`)
			newActiveTabPaneEl.setAttribute('style', 'display: block')
		}

	}
	findTab(tab) {
		return _.find(this.tabs, ['name', tab.name || tab])
	}
	getCurrentActiveTab() {
		return _.find(this.tabs, ['isActive', true])
	}
	findPane(tab){
		return document.getElementById(`tab-pane-wrapper-${_.get(this.findTab(tab), 'id')}`)
	}
	remove(tab) {
		var rem = this.findTab(tab)
		if (!rem) {
			return
		}
		this.tabsContainerEl.querySelector(`#tab-${rem.id}`).remove()
		this.panesContainerEl.querySelector(`#tab-pane-wrapper-${rem.id}`).remove()
		this.tabs.splice(_.findIndex(this.tabs, ['name', tab.name || tab]), 1)
	}
}
