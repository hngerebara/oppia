// eslint-disable-next-line oppia/no-multiline-disable
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service to build changes to a collection. These changes may
 * then be used by other services, such as a backend API service to update the
 * collection in the backend. This service also registers all changes with the
 * undo/redo service.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { CollectionDomainConstants } from
  'domain/collection/collection-domain.constants';
import { Collection } from 'domain/collection/collection.model';
import { CollectionNode } from './collection-node.model';
import { Change } from 'domain/editor/undo_redo/change.model';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionUpdateService {
  constructor(private undoRedoService: UndoRedoService) {}

  private _applyChange(collection, command, params, apply, reverse) {
    let changeDict = params;
    changeDict.cmd = command;
    let changeObj = new Change(changeDict, apply, reverse);
    this.undoRedoService.applyChange(changeObj, collection);
  }

  private _getParameterFromChangeDict(changeDict, paramName) {
    return changeDict[paramName];
  }

  // Applies a collection property change, specifically. See _applyChange()
  // for details on the other behavior of this function.
  private _applyPropertyChange(
      collection, propertyName, newValue, oldValue, apply, reverse) {
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_EDIT_COLLECTION_PROPERTY, {
        property_name: propertyName,
        new_value: newValue,
        old_value: oldValue
      }, apply, reverse);
  }

  private _getNewPropertyValueFromChangeDict(changeDict) {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  private _getExplorationIdFromChangeDict(changeDict) {
    return this._getParameterFromChangeDict(changeDict, 'exploration_id');
  }

  private _getFirstIndexFromChangeDict(changeDict) {
    return this._getParameterFromChangeDict(changeDict, 'first_index');
  }

  private _getSecondIndexFromChangeDict(changeDict) {
    return this._getParameterFromChangeDict(changeDict, 'second_index');
  }

  addCollectionNode(
      collection: Collection,
      explorationId: string,
      explorationSummaryBackendObject): void {
    let oldSummaryBackendObject = explorationSummaryBackendObject;
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_ADD_COLLECTION_NODE, {
        exploration_id: explorationId
      }, (changeDict, collection) => {
        // Apply.
        let explorationId = this._getExplorationIdFromChangeDict(changeDict);
        let collectionNode = (
          CollectionNode.createFromExplorationId(
            explorationId));
        collectionNode.setExplorationSummaryObject(oldSummaryBackendObject);
        collection.addCollectionNode(collectionNode);
      }, (changeDict, collection) => {
        // Undo.
        let explorationId = this._getExplorationIdFromChangeDict(changeDict);
        collection.deleteCollectionNode(explorationId);
      });
  }

  swapNodes(collection:unknown, firstIndex, secondIndex): void {
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_SWAP_COLLECTION_NODES, {
        first_index: firstIndex,
        second_index: secondIndex
      }, (changeDict, collection) => {
        // Apply.
        let firstIndex = this._getFirstIndexFromChangeDict(changeDict);
        let secondIndex = this._getSecondIndexFromChangeDict(changeDict);

        collection.swapCollectionNodes(firstIndex, secondIndex);
      }, (changeDict, collection) => {
        // Undo.
        let firstIndex = this._getFirstIndexFromChangeDict(changeDict);
        let secondIndex = this._getSecondIndexFromChangeDict(changeDict);

        collection.swapCollectionNodes(firstIndex, secondIndex);
      });
  }

  /**
   * Removes an exploration from a collection and records the change in
   * the undo/redo service.
   */
  deleteCollectionNode(
      collection: Collection,
      explorationId: string): void {
    let oldCollectionNode = collection.getCollectionNodeByExplorationId(
      explorationId);
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_DELETE_COLLECTION_NODE, {
        exploration_id: explorationId
      }, (changeDict, collection) => {
        // Apply.
        let explorationId = this._getExplorationIdFromChangeDict(changeDict);
        collection.deleteCollectionNode(explorationId);
      }, (changeDict, collection) => {
        // Undo.
        collection.addCollectionNode(oldCollectionNode);
      });
  }

  /**
   * Changes the title of a collection and records the change in the
   * undo/redo service.
   */
  setCollectionTitle(collection: Collection, title: string): void {
    let oldTitle = collection.getTitle();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_TITLE, title, oldTitle,
      (changeDict, collection) => {
        // ---- Apply ----
        let title = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setTitle(title);
      }, (changeDict, collection) => {
        // ---- Undo ----
        collection.setTitle(oldTitle);
      });
  }

  /**
   * Changes the category of a collection and records the change in the
   * undo/redo service.
   */
  setCollectionCategory(collection: Collection, category: string): void {
    let oldCategory = collection.getCategory();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_CATEGORY, category,
      oldCategory, (changeDict, collection) => {
        // Apply.
        let category = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setCategory(category);
      }, (changeDict, collection) => {
        // Undo.
        collection.setCategory(oldCategory);
      });
  }

  /**
   * Changes the objective of a collection and records the change in the
   * undo/redo service.
   */
  setCollectionObjective(collection: Collection, objective: string): void {
    let oldObjective = collection.getObjective();
    this._applyPropertyChange(
      collection, CollectionDomainConstants.COLLECTION_PROPERTY_OBJECTIVE,
      objective, oldObjective, (changeDict, collection) => {
        // Apply.
        let objective = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setObjective(objective);
      }, (changeDict, collection) => {
        // Undo.
        collection.setObjective(oldObjective);
      });
  }

  /**
   * Changes the language code of a collection and records the change in
   * the undo/redo service.
   */
  setCollectionLanguageCode(
      collection: Collection,
      languageCode: string): void {
    let oldLanguageCode = collection.getLanguageCode();
    this._applyPropertyChange(
      collection, CollectionDomainConstants.COLLECTION_PROPERTY_LANGUAGE_CODE,
      languageCode, oldLanguageCode, (changeDict, collection) => {
        // Apply.
        let languageCode = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setLanguageCode(languageCode);
      }, (changeDict, collection) => {
        // Undo.
        collection.setLanguageCode(oldLanguageCode);
      });
  }

  /**
   * Changes the tags of a collection and records the change in
   * the undo/redo service.
   */
  setCollectionTags(collection: Collection, tags: string[]): void {
    let oldTags = collection.getTags();
    this._applyPropertyChange(
      collection, CollectionDomainConstants.COLLECTION_PROPERTY_TAGS,
      tags, oldTags, (changeDict, collection) => {
        // Apply.
        let tags = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setTags(tags);
      }, (changeDict, collection) => {
        // Undo.
        collection.setTags(oldTags);
      });
  }

  /**
   * Returns whether the given change object constructed by this service
   * is adding a new collection node to a collection.
   */
  isAddingCollectionNode(changeObject): boolean {
    let backendChangeObject = changeObject.getBackendChangeObject();
    return backendChangeObject.cmd === (
      CollectionDomainConstants.CMD_ADD_COLLECTION_NODE);
  }

  /**
   * Returns the exploration ID referenced by the specified change object,
   * or undefined if the given changeObject does not reference an
   * exploration ID. The change object is expected to be one constructed
   * by this service.
   */
  getExplorationIdFromChangeObject(changeObject): void {
    return this._getExplorationIdFromChangeDict(
      changeObject.getBackendChangeObject());
  }
}
angular.module('oppia').factory('CollectionUpdateService',
  downgradeInjectable(CollectionUpdateService));

// Require('domain/editor/undo_redo/undo-redo.service.ts');
// require('domain/collection/collection-domain.constants.ajs.ts');

// angular.module('oppia').factory('CollectionUpdateService', [
//   'UndoRedoService', 'CMD_ADD_COLLECTION_NODE',
//   'CMD_DELETE_COLLECTION_NODE',
//   'CMD_EDIT_COLLECTION_PROPERTY', 'CMD_SWAP_COLLECTION_NODES',
//   'COLLECTION_PROPERTY_CATEGORY', 'COLLECTION_PROPERTY_LANGUAGE_CODE',
//   'COLLECTION_PROPERTY_OBJECTIVE',
//   'COLLECTION_PROPERTY_TAGS', 'COLLECTION_PROPERTY_TITLE', function(
//       UndoRedoService,
//       CMD_ADD_COLLECTION_NODE,
//       CMD_DELETE_COLLECTION_NODE,
//       CMD_EDIT_COLLECTION_PROPERTY, CMD_SWAP_COLLECTION_NODES,
//       COLLECTION_PROPERTY_CATEGORY, COLLECTION_PROPERTY_LANGUAGE_CODE,
//       COLLECTION_PROPERTY_OBJECTIVE,
//       COLLECTION_PROPERTY_TAGS, COLLECTION_PROPERTY_TITLE) {
//     // Creates a change using an apply function, reverse function, a change
//     // command and related parameters. The change is applied to a given
//     // collection.
//     ar _applyChange = function(collection, command, params, apply, reverse) {
//       var changeDict = angular.copy(params);
//       changeDict.cmd = command;
//       var changeObj = new Change(changeDict, apply, reverse);
//       UndoRedoService.applyChange(changeObj, collection);
//     };

//     var _getParameterFromChangeDict = function(changeDict, paramName) {
//       return changeDict[paramName];
//     };

//     // Applies a collection property change, specifically. See _applyChange()
//     // for details on the other behavior of this function.
//     var _applyPropertyChange = function(
//         collection, propertyName, newValue, oldValue, apply, reverse) {
//       _applyChange(collection, CMD_EDIT_COLLECTION_PROPERTY, {
//         property_name: propertyName,
//         new_value: angular.copy(newValue),
//         old_value: angular.copy(oldValue)
//       }, apply, reverse);
//     };

//     var _getNewPropertyValueFromChangeDict = function(changeDict) {
//       return _getParameterFromChangeDict(changeDict, 'new_value');
//     };

//     var _getExplorationIdFromChangeDict = function(changeDict) {
//       return _getParameterFromChangeDict(changeDict, 'exploration_id');
//     };

//     var _getFirstIndexFromChangeDict = function(changeDict) {
//       return _getParameterFromChangeDict(changeDict, 'first_index');
//     };

//     var _getSecondIndexFromChangeDict = function(changeDict) {
//       return _getParameterFromChangeDict(changeDict, 'second_index');
//     };

//     // These functions are associated with updates available in
//     // core.domain.collection_services.apply_change_list.
//     return {
//       /**
//        * Adds a new exploration to a collection and records the change in the
//        * undo/redo service.
//        */
//       addCollectionNode: function(
//           collection, explorationId, explorationSummaryBackendObject) {
//         var oldSummaryBackendObject = angular.copy(
//           explorationSummaryBackendObject);
//         _applyChange(collection, CMD_ADD_COLLECTION_NODE, {
//           exploration_id: explorationId
//         }, function(changeDict, collection) {
//           // Apply.
//           var explorationId = _getExplorationIdFromChangeDict(changeDict);
//           var collectionNode = (
//             CollectionNode.createFromExplorationId(
//               explorationId));
//           cllectionNode.setExplorationSummaryObject(oldSummaryBackendObject);
//           collection.addCollectionNode(collectionNode);
//         }, function(changeDict, collection) {
//           // Undo.
//           var explorationId = _getExplorationIdFromChangeDict(changeDict);
//           collection.deleteCollectionNode(explorationId);
//         });
//       },

//       swapNodes: function(collection, firstIndex, secondIndex) {
//         _applyChange(collection, CMD_SWAP_COLLECTION_NODES, {
//           first_index: firstIndex,
//           second_index: secondIndex
//         }, function(changeDict, collection) {
//           // Apply.
//           var firstIndex = _getFirstIndexFromChangeDict(changeDict);
//           var secondIndex = _getSecondIndexFromChangeDict(changeDict);

//           collection.swapCollectionNodes(firstIndex, secondIndex);
//         }, function(changeDict, collection) {
//           // Undo.
//           var firstIndex = _getFirstIndexFromChangeDict(changeDict);
//           var secondIndex = _getSecondIndexFromChangeDict(changeDict);

//           collection.swapCollectionNodes(firstIndex, secondIndex);
//         });
//       },

//       /**
//        * Removes an exploration from a collection and records the change in
//        * the undo/redo service.
//        */
//       deleteCollectionNode: function(collection, explorationId) {
//         var oldCollectionNode = angular.copy(
//           collection.getCollectionNodeByExplorationId(explorationId));
//         _applyChange(collection, CMD_DELETE_COLLECTION_NODE, {
//           exploration_id: explorationId
//         }, function(changeDict, collection) {
//           // Apply.
//           var explorationId = _getExplorationIdFromChangeDict(changeDict);
//           collection.deleteCollectionNode(explorationId);
//         }, function(changeDict, collection) {
//           // Undo.
//           collection.addCollectionNode(oldCollectionNode);
//         });
//       },

//       /**
//        * Changes the title of a collection and records the change in the
//        * undo/redo service.
//        */
//       setCollectionTitle: function(collection, title) {
//         var oldTitle = angular.copy(collection.getTitle());
//         _applyPropertyChange(
//           collection, COLLECTION_PROPERTY_TITLE, title, oldTitle,
//           function(changeDict, collection) {
//             // ---- Apply ----
//             var title = _getNewPropertyValueFromChangeDict(changeDict);
//             collection.setTitle(title);
//           }, function(changeDict, collection) {
//             // ---- Undo ----
//             collection.setTitle(oldTitle);
//           });
//       },

//       /**
//        * Changes the category of a collection and records the change in the
//        * undo/redo service.
//        */
//       setCollectionCategory: function(collection, category) {
//         var oldCategory = angular.copy(collection.getCategory());
//         _applyPropertyChange(
//           collection, COLLECTION_PROPERTY_CATEGORY, category, oldCategory,
//           function(changeDict, collection) {
//             // Apply.
//             var category = _getNewPropertyValueFromChangeDict(changeDict);
//             collection.setCategory(category);
//           }, function(changeDict, collection) {
//             // Undo.
//             collection.setCategory(oldCategory);
//           });
//       },

//       /**
//        * Changes the objective of a collection and records the change in the
//        * undo/redo service.
//        */
//       setCollectionObjective: function(collection, objective) {
//         var oldObjective = angular.copy(collection.getObjective());
//         _applyPropertyChange(
//           collection, COLLECTION_PROPERTY_OBJECTIVE, objective, oldObjective,
//           function(changeDict, collection) {
//             // Apply.
//             var objective = _getNewPropertyValueFromChangeDict(changeDict);
//             collection.setObjective(objective);
//           }, function(changeDict, collection) {
//             // Undo.
//             collection.setObjective(oldObjective);
//           });
//       },

//       /**
//        * Changes the language code of a collection and records the change in
//        * the undo/redo service.
//        */
//       setCollectionLanguageCode: function(collection, languageCode) {
//         var oldLanguageCode = angular.copy(collection.getLanguageCode());
//         _applyPropertyChange(
//           collection, COLLECTION_PROPERTY_LANGUAGE_CODE, languageCode,
//           oldLanguageCode,
//           function(changeDict, collection) {
//             // Apply.
//             vr languageCode = _getNewPropertyValueFromChangeDict(changeDict);
//             collection.setLanguageCode(languageCode);
//           }, function(changeDict, collection) {
//             // Undo.
//             collection.setLanguageCode(oldLanguageCode);
//           });
//       },

//       /**
//        * Changes the tags of a collection and records the change in
//        * the undo/redo service.
//        */
//       setCollectionTags: function(collection, tags) {
//         var oldTags = angular.copy(collection.getTags());
//         _applyPropertyChange(
//           collection, COLLECTION_PROPERTY_TAGS, tags, oldTags,
//           function(changeDict, collection) {
//             // Apply.
//             var tags = _getNewPropertyValueFromChangeDict(changeDict);
//             collection.setTags(tags);
//           }, function(changeDict, collection) {
//             // Undo.
//             collection.setTags(oldTags);
//           });
//       },

//       /**
//        * Returns whether the given change object constructed by this service
//        * is adding a new collection node to a collection.
//        */
//       isAddingCollectionNode: function(changeObject) {
//         var backendChangeObject = changeObject.getBackendChangeObject();
//         return backendChangeObject.cmd === CMD_ADD_COLLECTION_NODE;
//       },

//       /**
//        * Returs the exploration ID referenced by the specified change object,
//        * or undefined if the given changeObject does not reference an
//        * exploration ID. The change object is expected to be one constructed
//        * by this service.
//        */
//       getExplorationIdFromChangeObject: function(changeObject) {
//         return _getExplorationIdFromChangeDict(
//           changeObject.getBackendChangeObject());
//       }
//     };
//   }]);
