/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import type { ɵCheckableListInstance } from '@idux/components/_private/checkable-list'
import type { TableInstance } from '@idux/components/table'
import type { TreeInstance } from '@idux/components/tree'

import { computed, defineComponent, provide, ref } from 'vue'

import { type VKey, useControlledProp } from '@idux/cdk/utils'
import { useGlobalConfig as useComponentGlobalConfig } from '@idux/components/config'
import { IxTransfer, TRANSFER_DATA_STRATEGIES, type TransferListSlotParams } from '@idux/components/transfer'
import { useGlobalConfig } from '@idux/pro/config'

import { useTreeDataStrategies } from './composables/useTreeDataStrategy'
import { useTreeExpandedKeys } from './composables/useTreeExpandedKeys'
import ProTransferList from './content/ProTransferList'
import ProTransferTable from './content/ProTransferTable'
import ProTransferTree from './content/ProTransferTree'
import { type ProTransferContext, proTransferContext } from './token'
import { type ProTransferApis, type TreeTransferData, proTransferProps } from './types'

export default defineComponent({
  name: 'IxProTransfer',
  props: proTransferProps,
  setup(props, { slots, expose }) {
    const common = useGlobalConfig('common')
    const mergedPrefixCls = computed(() => `${common.prefixCls}-transfer`)
    const transferLocale = useComponentGlobalConfig('locale').transfer

    const [targetKeys, setTargetKeys] = useControlledProp(props, 'value')
    const targetKeySet = computed(() => new Set(targetKeys.value))
    const childrenKey = computed(() => props.treeProps?.childrenKey ?? 'children')

    const sourceContentRef = ref<ɵCheckableListInstance | TableInstance | TreeInstance>()
    const targetContentRef = ref<ɵCheckableListInstance | TableInstance | TreeInstance>()

    let context: ProTransferContext = {
      props,
      slots,
      childrenKey,
      mergedPrefixCls,
      sourceContentRef,
      targetContentRef,
    }
    let dataKeyMap: Map<VKey, TreeTransferData<VKey>>

    if (props.type === 'tree') {
      const {
        dataKeyMap: _dataKeyMap,
        parentKeyMap,
        dataStrategies,
      } = useTreeDataStrategies(childrenKey, props.defaultTargetData)
      const expandedKeysContext = useTreeExpandedKeys(props, targetKeys, parentKeyMap)

      dataKeyMap = _dataKeyMap

      context = {
        ...context,
        expandedKeysContext,
        parentKeyMap,
      }

      provide(TRANSFER_DATA_STRATEGIES, dataStrategies)
    }

    provide(proTransferContext, context)

    const renderTransferListBody = ({ isSource }: TransferListSlotParams) => {
      if (props.type === 'tree') {
        return !isSource && props.flatTargetData ? (
          <ProTransferList isSource={isSource} />
        ) : (
          <ProTransferTree isSource={isSource} />
        )
      }

      return <ProTransferTable isSource={isSource} />
    }
    const renderTranferTreeHeaderLabel = (params: { isSource: boolean }) => {
      if (slots.headerLabel) {
        return slots.headerLabel(params)
      }

      const isSource = params.isSource
      const label = isSource ? transferLocale.toSelect : transferLocale.selected

      let count = 0
      if (isSource) {
        dataKeyMap.forEach((item, key) => {
          if (!targetKeySet.value.has(key) && (!item[childrenKey.value] || item[childrenKey.value].length <= 0)) {
            ++count
          }
        })
      } else {
        targetKeys.value?.forEach(key => {
          const item = dataKeyMap.get(key)
          if (item && (!item[childrenKey.value] || item[childrenKey.value].length <= 0)) {
            ++count
          }
        })
      }

      return `${label} (${count})`
    }

    const transferApi: ProTransferApis = {
      scrollTo: (isSource, ...params) => (isSource ? sourceContentRef : targetContentRef).value?.scrollTo(...params),
    }

    expose(transferApi)

    return () => {
      const transferProps = {
        dataSource: props.dataSource,
        value: targetKeys.value,
        sourceSelectedKeys: props.sourceSelectedKeys,
        targetSelectedKeys: props.targetSelectedKeys,
        disabled: props.disabled,
        searchable: props.searchable,
        searchFn: props.searchFn,
        clearable: props.clearable,
        clearIcon: props.clearIcon,
        showSelectAll: props.type !== 'table',
        scroll: props.scroll,
        empty: props.empty,
        pagination: props.pagination,
        mode: props.mode,
        spin: props.spin,
        getKey: props.getKey,
        'onUpdate:value': setTargetKeys,
        'onUpdate:sourceSelectedKeys': props['onUpdate:sourceSelectedKeys'],
        'onUpdate:targetSelectedKeys': props['onUpdate:targetSelectedKeys'],
        onChange: props.onChange,
        onSearch: props.onSearch,
        onSelectAll: props.onSelectAll,
        onClear: props.onClear,
      }
      const transferSlots = {
        default: renderTransferListBody,
        headerLabel: props.type === 'tree' ? renderTranferTreeHeaderLabel : slots.headerLabel,
        headerSuffix: slots.headerSuffix,
        footer: slots.footer,
        clearIcon: slots.clearIcon,
        operations: slots.operations,
      }
      return <IxTransfer class={mergedPrefixCls.value} v-slots={transferSlots} {...transferProps} />
    }
  },
})