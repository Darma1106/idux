/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import { AbstractControl, FormArray, FormControl, FormGroup } from './controls'

export const isAbstractControl = (val: unknown): val is AbstractControl => {
  return val instanceof AbstractControl
}

export const isFormControl = (val: unknown): val is FormControl => {
  return val instanceof FormControl
}

export const isFormGroup = (val: unknown): val is FormGroup => {
  return val instanceof FormGroup
}

export const isFormArray = (val: unknown): val is FormArray => {
  return val instanceof FormArray
}
