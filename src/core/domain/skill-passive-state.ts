/** Persisted author settings used by every skill-row projection, including untrained checks. */
export interface SkillPassivePreference { override:boolean; overrideValue:number|null; advantage:boolean; disadvantage:boolean; condition:string }
export interface SkillPassiveState {
 [key:string]:unknown
 riders?:Record<string,string>
 searchActionType?:'Action'|'Bonus Action';studyActionType?:'Action'|'Bonus Action';influenceActionType?:'Action'|'Bonus Action';hideActionType?:'Action'|'Bonus Action';toolsActionType?:'Action'|'Bonus Action'
 searchPlacement?:'header'|'action'|'bonus_action'|'legendary';studyPlacement?:'header'|'action'|'bonus_action'|'legendary';influencePlacement?:'header'|'action'|'bonus_action'|'legendary';hidePlacement?:'header'|'action'|'bonus_action'|'legendary';toolsPlacement?:'header'|'action'|'bonus_action'|'legendary'
 searchMoveToActionGroup?:boolean;studyMoveToActionGroup?:boolean;influenceMoveToActionGroup?:boolean;hideMoveToActionGroup?:boolean;toolsMoveToActionGroup?:boolean
}
