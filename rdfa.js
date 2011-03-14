(function() {

  var DFA = function(states, alphabet, transitions, initial, accepts, input) {
    input = input || '';  

    this.tape_input = input;
    this.tape_pos = 0;

    this.states = states;
    this.alphabet = alphabet;
    this.transitions = transitions;
    this.initial = initial;
    this.accepts = this.buildAcceptArray(accepts, states);
    this.current = initial;
  };


  // Attempts to describe this abstractly all sound like gibberish, so here's 
  // an example:
  // buildAcceptArray([3, 5], 6) returns [false, false, false, true, false, true]
  DFA.prototype.buildAcceptArray = function(array, numstates) {
    array.sort(function(a, b) { return (a - b); });

    var ret = [];
    var j = 0;
    for(var i = 0; i < numstates; i += 1) {
      if(j < array.length && i === array[j]) {
        ret.push(true);
        j += 1;
      } else {
        ret.push(false);
      }
    }

    return ret;
  };

  // Reads the next input, updates the current state, advances the tape.
  DFA.prototype.step = function() {
    var next_input = this.tape_input[this.tape_pos];
    this.current = this.transitions[this.current][next_input];
    this.tape_pos += 1;
  };


  DFA.prototype.reset = function() {
    this.current = this.initial;
    this.tape_pos = 0;
  };

  // helper function for checking if a symbol is in the alphabet
  DFA.prototype.inAlphabet = function(symbol) {
    for(var i = 0; i < this.alphabet.length; i += 1)
      if(this.alphabet[i] === symbol)
        return true;

    return false;
  }




  // Class for making/manipulating an interactive DFA with Raphael
  var RDFA = function(p) {
    this.DFA = new DFA(p.states, p.alphabet, p.transitions, p.initial, p.accepts, p.input);

    this.name = p.name;
    this.width = p.width;
    this.height = p.height;

    this.spos = p.spos; // State positions
    this.srad = p.srad; // State circle radius
    this.off_circ = p.srad + 3; // hackkkkkkk
    this.line_params = p.line_params || {"stroke-width": 2};

    this.robjs = {
      "state-circles": [],
      "state-text": [],
    };

    this.createHTML();
    this.paper = Raphael(this.name+'raph', this.width, this.height);

    // Initial draw of states
    for(var i = 0; i < this.DFA.states; i += 1) {
      this.drawState(i);
    }

    this.drawTape();
  }

  // I can't believe there's no built in string format in javascript.
  // Also, this code was stolen from stack overflow
  RDFA.prototype.format = function(string) {
    for(var i = 0; i < arguments.length; i++) {
      var regexp = new RegExp('\\{'+i+'\\}', 'gi');
      string = string.replace(regexp, arguments[i+1]);
    }
    return string;  
  }


  RDFA.prototype.createHTML = function() {
    var container = document.getElementById(this.name);
    var ctrl = document.createElement('div');
    var raph = document.createElement('div');
    raph.setAttribute('id', this.name+'raph');
    
    container.appendChild(ctrl);
    container.appendChild(raph);

    this.input_box = document.createElement('input');
    this.input_box.setAttribute('type', 'text');

    this.step_button = document.createElement('input');
    this.step_button.setAttribute('type', 'button');
    this.step_button.setAttribute('value', 'step');

    this.reset_button = document.createElement('input');
    this.reset_button.setAttribute('type', 'button');
    this.reset_button.setAttribute('value', 'reset');

    ctrl.appendChild(this.input_box);
    ctrl.appendChild(this.step_button);
    ctrl.appendChild(this.reset_button);

    // Attach handlers
    this.step_button.onclick = this.step();
    this.reset_button.onclick = this.reset();
    this.input_box.onkeyup = this.changeInput();
  }


  // the colors will eventually be customizable
  RDFA.prototype.getStateStyles = function() {
    return {
      's': {"stroke-width": 4, stroke: "#c9c9c9", fill: "#c9c9c9"},
      'sa': {"stroke-width": 4, stroke: "#000000", fill: "#c9c9c9"},
      'sh': {"stroke-width": 4, stroke: "#4e9cfc", fill: "#4e9cfc"},
      'sah': {"stroke-width": 4, stroke: "#000", fill: "#4e9cfc"},
      'f': {"font-size": 12, fill: "#000"},
      'fh': {"font-size": 12, fill: "#fff"}
    };
  };
  

  RDFA.prototype.drawState = function(state) {
    var ss = this.getStateStyles();
    var sparam = 's';
    var fparam = 'f';

    if(this.DFA.accepts[state]) {
      sparam += 'a';
    }

    if(this.DFA.current === state) {
      fparam += 'h';
      sparam += 'h';
    }

    if(typeof this.robjs['state-circles'][state] === 'object') {
      this.robjs['state-circles'][state].attr(ss[sparam]);
      this.robjs['state-text'][state].attr(ss[fparam]);
    } else {
      this.robjs['state-circles'][state] = this.paper.circle(this.spos[state][0], this.spos[state][1], this.srad).attr(ss[sparam]);
      this.robjs['state-text'][state] = this.paper.text(this.spos[state][0], this.spos[state][1], "s"+state).attr(ss[fparam]);
    }
  };


  RDFA.prototype.drawTape = function() {
    var xstart = this.width / 2 + 0.5;
    var ystart = 10.5;
    var tape_space = 12;

    if(this.robjs['tape-syms'] === undefined) {
      this.paper.rect(xstart-(tape_space/2), ystart-8, tape_space, 16);
      this.paper.path(this.format("M 0 {0} L {1} {0}", ystart-8, this.width));
      this.paper.path(this.format("M 0 {0} L {1} {0}", ystart+8, this.width));

      this.robjs['tape-syms'] = this.paper.set();
      this.drawTapeSymbols(xstart, ystart, tape_space);
    } else if(this.DFA.tape_pos === 0) {
      this.robjs['tape-syms'].remove();
      this.drawTapeSymbols(xstart, ystart, tape_space);
    } else {
      this.robjs['tape-syms'].translate(-1*tape_space, 0);
    }

  };

  RDFA.prototype.drawTapeSymbols = function(xstart, ystart, tape_space) {
    var textx = xstart + tape_space;
    var p = {"font-size": 12}

    for(var i = 0; i < this.DFA.tape_input.length; i++) {
      this.robjs['tape-syms'].push(
        this.paper.text(textx + tape_space*i, ystart, this.DFA.tape_input[i]).attr(p));
    }
  };



  RDFA.prototype.drawArrowHead = function(path) {
    var pt1 = path.getPointAtLength(0);
    var pt2 = path.getPointAtLength(10);
  
    var init_ang = Raphael.rad(Raphael.angle(pt1.x, pt1.y, pt2.x, pt2.y));
    var arr_ang = Math.PI/8;
    var off_sin = 10 * Math.sin(init_ang+arr_ang);
    var off_cos = 10 * Math.cos(init_ang+arr_ang);

    var c1 = 10 * Math.cos(arr_ang);
    var s1 = 10 * Math.sin(arr_ang);
    var beta = Math.atan(s1/(10-c1));
    var h = s1 / Math.sin(beta);

    var A = Math.PI/2 - beta - (arr_ang-init_ang);
  
    var off2_x = h * Math.sin(A);
    var off2_y = h * Math.cos(A);

    var offcut_x = 5 * Math.cos(init_ang);
    var offcut_y = 5 * Math.sin(init_ang);

    this.paper.path(this.format("M {0},{1} L {2},{3} L {4},{5} L {6},{7} z",
      pt1.x, pt1.y,
      pt1.x-off_cos, pt1.y-off_sin,
      pt2.x+offcut_x, pt2.y+offcut_y,
      pt2.x-off2_x, pt2.y+off2_y)).attr({fill: "#000"});

  };


  RDFA.prototype.labelArrow = function(path, label, offx, offy) {
    var pathlen = path.getTotalLength();
    var midpt = path.getPointAtLength(pathlen / 2);
    this.paper.text(midpt.x+offx, midpt.y+offy, label);
  };


  /* 
   * We draw arrows starting at the "to" state and going to the "from" state because it is
   * slightly more convenient for drawArrowHead (simply start at the beginning of the path
   * instead of finding the length of the path and subtracting).
   */
  
  RDFA.prototype.selfArrow = function(st, ang, length, label, label_offx, label_offy) {
    var ang_gap = Math.PI/10;
    this.curvedArrow(st, st, ang-ang_gap, ang+ang_gap, 
     length, length, label, label_offx, label_offy);

  }
  

  RDFA.prototype.straightArrow = function(from, to, f_ang, t_ang, label, label_offx, label_offy) {
    var spos = this.spos;

    var from_off_cos = this.off_circ * Math.cos(f_ang);
    var from_off_sin = this.off_circ * Math.sin(f_ang);

    var to_off_cos = this.off_circ * Math.cos(t_ang);
    var to_off_sin = this.off_circ * Math.sin(t_ang);

    var path = this.paper.path(this.format("M {0},{1} L {2},{3}",
      spos[to][0]+to_off_cos, spos[to][1]-to_off_sin,
      spos[from][0]+from_off_cos, spos[from][1]-from_off_sin)).attr(this.line_params);

    this.drawArrowHead(path);

    this.labelArrow(path, label, label_offx, label_offy);
  }


  RDFA.prototype.initialArrow = function(to, ang, length) {
    var spos = this.spos;

    var off_cos = this.off_circ * Math.cos(ang);
    var off_sin = this.off_circ * Math.sin(ang);

    var length_off_cos = length * Math.cos(ang);
    var length_off_sin = length * Math.sin(ang);

    var path = this.paper.path(this.format("M {0},{1} L {2},{3}",
      spos[to][0]+off_cos, spos[to][1]-off_sin,
      spos[to][0]+length_off_cos, spos[to][1]-length_off_sin)).attr(this.line_params);

    this.drawArrowHead(path);
  }


  RDFA.prototype.curvedArrow = function(from, to, f_ang, t_ang, f_curve, t_curve, label, label_offx, label_offy) {
    var spos = this.spos;

    var from_off_cos = this.off_circ*Math.cos(f_ang);
    var from_off_sin = this.off_circ*Math.sin(f_ang);
    var from_bez_cos = f_curve*Math.cos(f_ang);
    var from_bez_sin = f_curve*Math.sin(f_ang);

    var to_off_cos = this.off_circ*Math.cos(t_ang);
    var to_off_sin = this.off_circ*Math.sin(t_ang);
    var to_bez_cos = t_curve*Math.cos(t_ang);
    var to_bez_sin = t_curve*Math.sin(t_ang);

    var path = this.paper.path(this.format("M {0},{1} C {2},{3} {4},{5} {6},{7}",
      spos[to][0]+to_off_cos, spos[to][1]-to_off_sin, 
      spos[to][0]+to_bez_cos, spos[to][1]-to_bez_sin,
      spos[from][0]+from_bez_cos, spos[from][1]-from_bez_sin,
      spos[from][0]+from_off_cos, spos[from][1]-from_off_sin)).attr(this.line_params);

    this.drawArrowHead(path);

    this.labelArrow(path, label, label_offx, label_offy);
  }


  RDFA.prototype.step = function() {
    var that = this;
    var func = function() {
      var prev = that.DFA.current;
      that.DFA.step();
      var next = that.DFA.current;

      that.drawState(prev);
      that.drawState(next);
      that.drawTape();

      if(that.DFA.tape_pos === that.DFA.tape_input.length)
        that.step_button.disabled = true;
    }
    return func;
  };
  
  RDFA.prototype.reset = function() {
    var that = this;
    var func = function() {
      var prev = that.DFA.current;
      that.DFA.reset();
      var next = that.DFA.current;

      that.drawState(prev);
      that.drawState(next);
      that.drawTape();

      that.step_button.disabled = false;
    }
    return func;
  }


   RDFA.prototype.changeInput = function() {
     var that = this;
     var func = function(event) {
       event = event || windows.event;
       if(event.keyCode === 13) {
         var user_input = that.input_box.value;
      
         // validate user input before sending it to the DFA
         var isValid = true;
         for(var i = 0; i < user_input.length; i += 1) {
           if(that.DFA.inAlphabet(user_input[i]) === false) {
             isValid = false;
             i = user_input.length;
           }
         }

         if(isValid) {
           that.DFA.tape_input = user_input;
           (that.reset())();
         } else {
           alert("Dear Sir or Madam: You have entered an invalid input symbol");
         }

         that.input_box.value = "";
       }
     }

  return func;
}

  window.RDFA = RDFA;
})();
