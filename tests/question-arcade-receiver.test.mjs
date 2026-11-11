import test from 'node:test';import assert from 'node:assert/strict';
import {newState,buildHeldCrossing} from '../arcade/engine.mjs';
import {inspectHeld} from '../arcade/bridge/held-receiver.mjs';
test('separately implemented receiver holds only known synthetic fixtures',()=>{
 const envelope=buildHeldCrossing(newState(),'need-dinner','offer-farm',1000);
 const x=inspectHeld(envelope);assert.equal(x.status,'HOLD_DEMO');assert.equal(x.liveEligible,false);assert.equal(x.publicationAuthorized,false);
});
test('receiver refuses false permissions, forged origin, and contradictory tags',()=>{
 const good=buildHeldCrossing(newState(),'need-dinner','offer-farm',1000);
 assert.equal(inspectHeld({...good,origin:'REAL_PERSON'}).status,'REFUSE');
 assert.equal(inspectHeld({...good,permissions:{...good.permissions,transmission:true}}).status,'REFUSE');
 assert.equal(inspectHeld({...good,evidence:{sharedTags:['NOT_PRESENT']}}).status,'REFUSE');
});
