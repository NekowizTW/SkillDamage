var item = "<li class='item pure-menu-item {{ selected ? \"selected\" : \"pending\" }}'>" +
             "<input type='checkbox' checked='{{selected}}' on-change='selectData'>" +
             "<span class='damage' on-tap='edit'>" +
               "{{damage}} " + "Chain: {{chain}} " + "攻擊屬性: {{propCounterFormat(propConter)}} " + 
               "{{others.bonusAttack ? \"條件觸發\" : \"\"}} " + "題目顏色: {{others.selectedColor}} " +
             "</span>" +

               "{{#if editing}}" +
               "<div class='pure-g'>" +
               "<div class='pure-u-1 pure-u-md-1-3'>" +
                  "<label>傷害量</label>" +
                  "<input id='edit_damage' class='edit' value='{{damage}}'>" +
                "</div>" +
                "<div class='pure-u-1 pure-u-md-1-3'>" +
                  "<label>Chain</label>" +
                  "<input id='edit_chain' class='edit' value='{{chain}}'>" +
                "</div>" +
                "<div class='pure-u-1 pure-u-md-1-3'>" +
                  "<label>攻擊屬性</label>" +
                  "<select class='edit' value={{propConter}}>" +
                    "<option value='1'>被剋屬</option>" +
                    "<option value='2'>同屬</option>" +
                    "<option value='3'>剋屬</option>" +
                  "</select>" +
                "</div>" +
                "<div class='pure-u-1 pure-u-md-1-3'>" +
                  "<h4>額外選項: </h4>" +
                "</div>" +
                "<div class='pure-u-1 pure-u-md-1-3'>" +
                  "<label>&nbsp;</label>" +
                  "<input class='edit' type='checkbox' checked='{{others.bonusAttack}}'>條件觸發" +
                "</div>" +
                "<div class='pure-u-1 pure-u-md-1-3'>" +
                  "<label>題目顏色</label>" +
                  "<select class='edit' value={{others.selectedColor}}>" +
                    "<option value='1'>單色</option>" +
                    "<option value='2'>雙色</option>" +
                    "<option value='3'>三色</option>" +
                  "</select>" +
                "</div>" +
                "</div>" +
                "<a class='submit-button button-success pure-button button-xsmall' on-tap='stop_editing'><i class='fa fa-check' aria-hidden='true'></i></a>" +

               "{{/if}}" +
             "<a class='delete-button button-error pure-button button-xsmall' on-tap='remove'><i class='fa fa-minus' aria-hidden='true'></i></a>" +
           "</li>";

var DamageList = Ractive.extend({
  template: '#template',

  partials: { item: item },

  editBaseAtk: function ( atk ) {
    this.set('baseAtk', atk);
  },

  editModeAtk: function ( type ) {
    this.set('modeAtk', type);
  },

  addItem: function ( damage ) {
    this.push( 'items', {
      damage: damage,
      selected: true,
      chain: 1,
      propConter: 3,
      propCounterFormat: function(val) {
        var list = ['未知', '被剋屬', '同屬', '剋屬'];
        return list[val];
      },
      others: {
        bonusAttack: false,
        selectedColor: 1
      }
    });
  },

  removeItem: function ( index ) {
    this.splice( 'items', index, 1 );
  },

  editItem: function ( index ) {
    var self = this, keydownHandler, blurHandler, input, currentDamage;
    currentDamage = this.get( 'items.' + index + '.damage' );
    this.set( 'items.' + index + '.editing', true );
    toHtmlNumericInput('edit_damage');
    toHtmlNumericInput('edit_chain');
  },

  stop_editingItem: function (index) {
    forceRemoveEvent('edit_damage');
    forceRemoveEvent('edit_chain');
    this.set( 'items.' + index + '.editing', false );
  },

  calPercent: function(){
    this.set('percent', []);
    var source = this.get();
    //var percent = {min: 0, max: 0, average: 0};
    var selectedList = _.filter(source.items, function(item){ return item.selected; });
    this.set('dataNum', selectedList.length);
    if(source.baseAtk <= 0 || selectedList.length <= 0) return;
    var partitionOthers = _.partition(selectedList, {'others': {'bonusAttack': false, 'selectedColor': 1}});
    for(var i in partitionOthers[0]){
      var data = partitionOthers[0][i];
      data.calc = data.damage/(source.baseAtk/2 * (data.chain/100 + 1) * data.propConter/2 );
    }
    console.log(partitionOthers[0]);
    this.push('percent', {
      'max': _.meanBy(partitionOthers[0], function(o){ return o.calc;})/0.9 || 0,
      'average': _.meanBy(partitionOthers[0], function(o){ return o.calc;}) || 0,
      'min': _.meanBy(partitionOthers[0], function(o){ return o.calc;})/1.1 || 0
    });
    if(partitionOthers[1].length <= 0)return;
    var partitionBonusAttack = _.partition(partitionOthers[1], {'others': {'bonusAttack': true}});
    if(partitionBonusAttack[0].length >=0){
      var selectedColor = [[], [], []];
      for(var i in partitionBonusAttack[0]){
        var data = partitionBonusAttack[0][i];
        data.calc = data.damage/(source.baseAtk/2 * (data.chain/100 + 1) * data.propConter/2 );
        selectedColor[data.others.selectedColor-1].push(data.calc);
      }
      for(var num in selectedColor){
        this.push('percent', {
          'max': _.mean(selectedColor[num])/0.9 || 0,
          'average': _.mean(selectedColor[num]) || 0,
          'min': _.mean(selectedColor[num])/1.1 || 0
        });
        if(num == 0 && selectedColor[1].length == 0 && selectedColor[2].length == 0)break;
      }
    }else{
      var selectedColor = [[], []];
      for(var i in partitionBonusAttack[1]){
        var data = partitionBonusAttack[1][i];
        data.calc = data.damage/(source.baseAtk/2 * (data.chain/100 + 1) * data.propConter/2 );
        selectedColor[data.others.selectedColor-2].push(data.calc);
      }
      for(var num in selectedColor){
        this.push('percent', {
          'max': _.meanBy(selectedColor[0], function(o){ return o.calc/0.9}) || 0,
          'average': _.meanBy(selectedColor[0], function(o){ return o.calc}) || 0,
          'min': _.meanBy(selectedColor[0], function(o){ return o.calc/1.1}) || 0
        });
      }
    }
  },

  oninit: function ( options ) {
    // proxy event handlers
    this.on({
      remove: function ( event ) {
        this.removeItem( event.keypath.replace('items.','') );
        this.calPercent();
      },
      newBaseAtk: function ( event ) {
        this.editBaseAtk( event.node.value );
        this.calPercent();
      },
      newModeAtk: function ( event ) {
        this.editModeAtk( event.node.value );
      },
      newDamage: function ( event ) {
        this.addItem( event.node.value );
        event.node.value = '';
        this.calPercent();
        setTimeout( function () {
          event.node.focus();
        }, 0 );
      },
      selectData: function(event){
        this.calPercent();
      },
      edit: function ( event ) {
        this.editItem( event.keypath.replace('items.','') );
      },
      stop_editing: function ( event ) {
        this.stop_editingItem( event.keypath.replace('items.','') );
        this.calPercent();
      },
      blur: function ( event ) {
        event.node.blur();
      }
    });
  },

  // sadly this is necessary for IE - other browsers fire the change event
  // when you hit enter
  events: {
    enter: function ( node, fire ) {
      var keydownHandler = function ( event ) {
        var which = event.which || event.keyCode;
        which === 13 && fire({ node: node, original: event });
      };

      node.addEventListener( 'keydown', keydownHandler );

      return {
        teardown: function () {
          node.removeEventListener( 'keydown', keydownHandler );
        }
      };
    }
  }
});

function init(docs){
  var ractive = new DamageList({
    el: '#list',
    data: {
      baseAtk: 0,
      modeAtk: 1.1,
      items: [],
      percent: [],
      dataNum: 0,
      powerFormat: function(){
        var percent = this.get('percent');
        switch(percent.length){
          case 0: return '';
          case 1: return percent[0].min.toFixed(2) + '~' + percent[0].max.toFixed(2);
          case 2: return percent[0].min.toFixed(2) + '~' + percent[0].max.toFixed(2) + ' ' + percent[1].min.toFixed(2) + '~' + percent[1].max.toFixed(2) + '(條件觸發)';
          case 3: return percent[0].min.toFixed(2) + '~' + percent[0].max.toFixed(2) + ' ' + percent[1].min.toFixed(2) + '~' + percent[1].max.toFixed(2) + '(雙色) ' + percent[2].min.toFixed(2) + '~' + percent[2].max.toFixed(2) + '(三色)';
          case 4: return percent[0].min.toFixed(2) + '~' + percent[0].max.toFixed(2) + ' ' + percent[1].min.toFixed(2) + '~' + percent[1].max.toFixed(2) + '(條件觸發)' + percent[2].min.toFixed(2) + '~' + percent[2].max.toFixed(2) + '(條件雙色)' + percent[3].min.toFixed(2) + '~' + percent[3].max.toFixed(2) + '(條件三色)';
        }
      },
      docs: docs,
      docsFormat: function(id, type){
        var docs = this.get('docs');
        var key = _.findIndex(docs, function(o){ return o.id == id});
        return docs[key][type];
      }
    }
  });
  toHtmlNumericInput('baseAtk');
  toHtmlNumericInput('newDamage');
}

var r = new XMLHttpRequest();
r.open("GET", "./docs.json", true);
r.onreadystatechange = function () {
  if (r.readyState != 4 || r.status != 200) return;
  init(JSON.parse(r.responseText));
};
r.send();