// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillUpdateService.
 */

import { TestBed } from '@angular/core/testing';

import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SubtitledHtmlObjectFactory } from 'domain/exploration/SubtitledHtmlObjectFactory';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { WorkedExampleObjectFactory } from 'domain/skill/WorkedExampleObjectFactory';

describe('Skill update service', () => {
  let skillUpdateService: SkillUpdateService = null;
  let skillObjectFactory: SkillObjectFactory = null;
  let subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory = null;
  let misconceptionObjectFactory: MisconceptionObjectFactory = null;
  let workedExampleObjectFactory: WorkedExampleObjectFactory = null;
  let undoRedoService: UndoRedoService = null;

  let skillDict = null;
  let skillContentsDict = null;
  let example1 = null;
  let example2 = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SkillUpdateService,
        UndoRedoService,
        MisconceptionObjectFactory,
        SkillObjectFactory,
        SubtitledHtmlObjectFactory,
        WorkedExampleObjectFactory,
      ],
    });

    skillUpdateService = TestBed.get(SkillUpdateService);
    undoRedoService = TestBed.get(UndoRedoService);

    misconceptionObjectFactory = TestBed.get(MisconceptionObjectFactory);
    skillObjectFactory = TestBed.get(SkillObjectFactory);
    subtitledHtmlObjectFactory = TestBed.get(SubtitledHtmlObjectFactory);
    workedExampleObjectFactory = TestBed.get(WorkedExampleObjectFactory);

    const misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };

    const misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true,
    };

    const rubricDict = {
      difficulty: 'Easy',
      explanations: ['explanation'],
    };

    example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'worked example explanation 1',
        content_id: 'worked_example_e_1',
      },
    };

    example2 = {
      question: {
        html: 'worked example question 2',
        content_id: 'worked_example_q_2',
      },
      explanation: {
        html: 'worked example explanation 2',
        content_id: 'worked_example_e_2',
      },
    };

    skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [example1, example2],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_1: {},
          worked_example_e_1: {},
          worked_example_q_2: {},
          worked_example_e_2: {},
        },
      },
    };

    skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: ['skill_1'],
    };
  });

  it('should set/unset the skill description', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.setSkillDescription(skill, 'new description');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_property',
        property_name: 'description',
        old_value: 'test description',
        new_value: 'new description',
      },
    ]);

    expect(skill.getDescription()).toEqual('new description');
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getDescription()).toEqual('test description');
  });

  it('should set/unset the concept card explanation', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.setConceptCardExplanation(
      skill,
      subtitledHtmlObjectFactory.createDefault('new explanation', 'explanation')
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_contents_property',
        property_name: 'explanation',
        old_value: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        new_value: {
          html: 'new explanation',
          content_id: 'explanation',
        },
      },
    ]);

    expect(skill.getConceptCard().getExplanation()).toEqual(
      subtitledHtmlObjectFactory.createDefault('new explanation', 'explanation')
    );
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getExplanation()).toEqual(
      subtitledHtmlObjectFactory.createDefault(
        'test explanation',
        'explanation'
      )
    );
  });

  it('should add a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);
    const aNewMisconceptionDict = {
      id: '7',
      name: 'test name 3',
      notes: 'test notes 3',
      feedback: 'test feedback 3',
      must_be_addressed: true,
    };

    const aNewMisconception = misconceptionObjectFactory.createFromBackendDict(
      aNewMisconceptionDict
    );
    skillUpdateService.addMisconception(skill, aNewMisconception);
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'add_skill_misconception',
        new_misconception_dict: aNewMisconceptionDict,
      },
    ]);
    expect(skill.getMisconceptions().length).toEqual(3);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should delete a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.deleteMisconception(skill, '2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'delete_skill_misconception',
        misconception_id: '2',
      },
    ]);
    expect(skill.getMisconceptions().length).toEqual(1);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should add a prerequisite skill', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.addPrerequisiteSkill(skill, 'skill_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'add_prerequisite_skill',
        skill_id: 'skill_2',
      },
    ]);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(2);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(1);
  });

  it('should delete a prerequisite skill', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.deletePrerequisiteSkill(skill, 'skill_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'delete_prerequisite_skill',
        skill_id: 'skill_1',
      },
    ]);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(0);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getPrerequisiteSkillIds().length).toEqual(1);
  });

  it('should update a rubric', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    expect(skill.getRubrics().length).toEqual(1);
    skillUpdateService.updateRubricForDifficulty(skill, 'Easy', [
      'new explanation 1',
      'new explanation 2',
    ]);
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_rubrics',
        difficulty: 'Easy',
        explanations: ['new explanation 1', 'new explanation 2'],
      },
    ]);
    expect(skill.getRubrics().length).toEqual(1);
    expect(skill.getRubrics()[0].getExplanations()).toEqual([
      'new explanation 1',
      'new explanation 2',
    ]);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getRubrics().length).toEqual(1);
    expect(skill.getRubrics()[0].getExplanations()).toEqual(['explanation']);
  });

  it('should update the name of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionName(
      skill,
      '2',
      skill.findMisconceptionById('2').getName(),
      'new name'
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'name',
        old_value: 'test name',
        new_value: 'new name',
        misconception_id: '2',
      },
    ]);
    expect(skill.findMisconceptionById('2').getName()).toEqual('new name');
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getName()).toEqual('test name');
  });

  it('should update the notes of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionNotes(
      skill,
      '2',
      skill.findMisconceptionById('2').getNotes(),
      'new notes'
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'notes',
        old_value: 'test notes',
        new_value: 'new notes',
        misconception_id: '2',
      },
    ]);
    expect(skill.findMisconceptionById('2').getNotes()).toEqual('new notes');
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getNotes()).toEqual('test notes');
  });

  it('should update the feedback of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionFeedback(
      skill,
      '2',
      skill.findMisconceptionById('2').getFeedback(),
      'new feedback'
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'feedback',
        old_value: 'test feedback',
        new_value: 'new feedback',
        misconception_id: '2',
      },
    ]);
    expect(skill.findMisconceptionById('2').getFeedback()).toEqual(
      'new feedback'
    );
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getFeedback()).toEqual(
      'test feedback'
    );
  });

  it('should update the feedback of a misconception', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.updateMisconceptionMustBeAddressed(
      skill,
      '2',
      skill.findMisconceptionById('2').isMandatory(),
      false
    );
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_misconceptions_property',
        property_name: 'must_be_addressed',
        old_value: true,
        new_value: false,
        misconception_id: '2',
      },
    ]);
    expect(skill.findMisconceptionById('2').isMandatory()).toEqual(false);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').isMandatory()).toEqual(true);
  });

  it('should add a worked example', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    const newExample = {
      question: {
        html: 'worked example question 3',
        content_id: 'worked_example_q_3'
      },
      explanation: {
        html: 'worked example explanation 3',
        content_id: 'worked_example_e_3'
      }
    };

    skillUpdateService.addWorkedExample(
      skill,
      workedExampleObjectFactory.createFromBackendDict(newExample)
    );
    // This throws No overload matches this call.
    // Overload 1 of 2, '(expected: Expected<ArrayLike<BackendChangeObject>>,
    // expectationFailOutput?: any): Promise<void>', gave the following error.
    // Type '{ cmd: string; property_name: string; old_value: { question:
    // { html: string; content_id: string; }; explanation: {
    // html: string; content_id: string; }; }[]; new_value: {
    // question: { html: string; content_id: string; }; explanation: { ...; };
    // }[]; }' is not assignable to type
    // 'ExpectedRecursive<BackendChangeObject>'.
    // Property ''subtopic_id'' is missing ...'.
    // @ts-ignore
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_contents_property',
        property_name: 'worked_examples',
        old_value: skillContentsDict.worked_examples,
        new_value: [example1, example2, newExample]
      }
    ]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      workedExampleObjectFactory.createFromBackendDict(example1),
      workedExampleObjectFactory.createFromBackendDict(example2),
      workedExampleObjectFactory.createFromBackendDict(newExample),
    ]);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      workedExampleObjectFactory.createFromBackendDict(example1),
      workedExampleObjectFactory.createFromBackendDict(example2),
    ]);
  });

  it('should delete a worked example', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    skillUpdateService.deleteWorkedExample(skill, 0);
    // This throws  Argument of type '{ cmd: string; property_name: string;
    // old_value: any; new_value: any; }' is not assignable
    // to parameter of type 'Expected<ArrayLike<BackendChangeObject>>'.
    // Property 'length' is missing in type '{ cmd: string;
    // property_name: string; old_value: any; new_value: any; }'
    // but required in type '{ [x: number]:
    // @ts-ignore
    expect(undoRedoService.getCommittableChangeList()).toEqual([
      {
        cmd: 'update_skill_contents_property',
        property_name: 'worked_examples',
        old_value: skillContentsDict.worked_examples,
        new_value: [skillContentsDict.worked_examples[1]],
      }
    ]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      workedExampleObjectFactory.createFromBackendDict(example2),
    ]);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      workedExampleObjectFactory.createFromBackendDict(example1),
      workedExampleObjectFactory.createFromBackendDict(example2),
    ]);
  });

  it('should update a worked example', () => {
    const skill = skillObjectFactory.createFromBackendDict(skillDict);

    const modifiedExample1 = {
      question: {
        html: 'new question 1',
        content_id: 'worked_example_q_1',
      },
      explanation: {
        html: 'new explanation 1',
        content_id: 'worked_example_e_1',
      },
    };

    skillUpdateService.updateWorkedExample(
      skill,
      0,
      'new question 1',
      'new explanation 1'
    );

    const workedExamples = {
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: skillContentsDict.worked_examples,
      new_value: [modifiedExample1, example2],
    };

    // This throws No overload matches this call.
    // Overload 1 of 2, '(expected: Expected<ArrayLike<BackendChangeObject>>,
    // expectationFailOutput?: any): Promise<void>', gave the following error.
    // Type '{ cmd: string; property_name: string; old_value: { question:
    // { html: string; content_id: string; }; explanation: {
    // html: string; content_id: string; }; }[]; new_value: {
    // question: { html: string; content_id: string; }; explanation: { ...; };
    // }[]; }' is not assignable to type
    // 'ExpectedRecursive<BackendChangeObject>'.
    // Property ''subtopic_id'' is missing ...'.
    // @ts-ignore
    // eslint-disable-next-line max-len
    expect(undoRedoService.getCommittableChangeList()).toEqual([workedExamples]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      workedExampleObjectFactory.createFromBackendDict(modifiedExample1),
      workedExampleObjectFactory.createFromBackendDict(example2),
    ]);
    // This throws "Type 'Skill' is not assignable to parameter of type
    // 'BackendChangeObject'.".
    // Type 'Skill' is not assignable to type
    // 'TopicRemoveUncategorizedSkillChange'
    // @ts-ignore
    undoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      workedExampleObjectFactory.createFromBackendDict(example1),
      workedExampleObjectFactory.createFromBackendDict(example2),
    ]);
  });
});
