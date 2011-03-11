var RDFA = function(stuff) {
  this.tape = {
    input: stuff.input,
    position: 0
  }

  this.DFA = {
    states: stuff.states,
    alphabet: stuff.alphabet,
    transitions: stuff.transitions,
    initial: stuff.initial,
    accepts: stuff.accepts,
    current: stuff.initial
  }

  this.paper = stuff.paper;
  this.robjs = {
    "input-els": null,
    "state-circles": [],
    "state-text": [],
  };
  this.spos = stuff.spos;
  this.circ_rad = stuff.circ_rad;
  this.off_circ = stuff.circ_rad + 3; // Hacky, fix this.
  this.line_params = stuff.line_params;
  this.tape_width = stuff.tape_width;

  // Initial draw of states
  for(var i = 0; i < this.DFA.states; i += 1) {
    this.drawState(i);
  }

};



// I can't believe there's no built in string format in javascript.
// Also, this code was stolen from stack overflow
RDFA.prototype.format = function(string) {
  for(var i = 0; i < arguments.length; i++) {
    var regexp = new RegExp('\\{'+i+'\\}', 'gi');
    string = string.replace(regexp, arguments[i+1]);
  }
  return string;  
}


RDFA.prototype.getNextState = function() {
  var next_letter = this.tape.input[this.tape.position];
  return this.DFA.transitions[this.DFA.current][next_letter];
}


RDFA.prototype.inAlphabet = function(symbol) {
  for(var i = 0; i < this.DFA.alphabet.length; i += 1)
    if(this.DFA.alphabet[i] === symbol)
      return true;

  return false;
}


RDFA.prototype.drawTape = function(reset) {
  var xstart = this.tape_width / 2 + 0.5;
  var ystart = 10.5;
  var tape_space = 12;

  var p = {"font-size": 12}
  this.paper.rect(xstart-6, ystart-8, 12, 16);
  var textx = xstart + tape_space;

  this.paper.path(this.format("M 0 {0} L {1} {0}", ystart-8, this.tape_width));
  this.paper.path(this.format("M 0 {0} L {1} {0}", ystart+8, this.tape_width));

  if(this.robjs['tape-els'] !== undefined && !reset) {
    this.robjs['tape-els'].translate(-1*tape_space, 0);
  } else {
    if(reset) {
	this.robjs['tape-els'].remove();
    } else {
      this.robjs['tape-els'] = this.paper.set();
    }

    for(var i = 0; i < this.tape.input.length; i++) {
      this.robjs['tape-els'].push(
        this.paper.text(textx + tape_space*i, ystart, this.tape.input[i]).attr(p));
    }
  }
};


RDFA.prototype.drawState = function(state) {
  var p = [];
  p['s'] = {"stroke-width": 4, stroke: "#c9c9c9", fill: "#c9c9c9"};
  p['sa'] = {"stroke-width": 4, stroke: "#000000", fill: "#c9c9c9"};
  p['sh'] = {"stroke-width": 4, stroke: "#4e9cfc", fill: "#4e9cfc"};
  p['sah'] = {"stroke-width": 4, stroke: "#000", fill: "#4e9cfc"};
  p['f'] = {"font-size": 12, fill: "#000"};
  p['fh'] = {"font-size": 12, fill: "#fff"};

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
    this.robjs['state-circles'][state].attr(p[sparam]);
    this.robjs['state-text'][state].attr(p[fparam]);
  } else {
    this.robjs['state-circles'][state] = this.paper.circle(this.spos[state][0], this.spos[state][1], this.circ_rad).attr(p[sparam]);
    this.robjs['state-text'][state] = this.paper.text(this.spos[state][0], this.spos[state][1], "s"+state).attr(p[fparam]);
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
}



/* 
 * We draw arrows starting at the "to" state and going to the "from" state because it is
 * slightly more convenient for drawArrowHead (simply start at the beginning of the path
 * instead of finding the length of the path and subtracting).
 */

RDFA.prototype.selfArrow = function(st, orient, label, label_offx, label_offy) {
  var offrad_cos = this.off_circ * Math.cos(2*Math.PI/5);
  var offrad_sin = this.off_circ * Math.sin(2*Math.PI/5);
  var offbez_cos = 55 * Math.cos(2*Math.PI/5);
  var offbez_sin = 55 * Math.sin(2*Math.PI/5);
  var spos = this.spos;

  if(orient === "b") {
    offrad_sin *= -1;
    offbez_sin *= -1;
  }

  var path = this.paper.path(this.format("M {0},{1}, C {2},{3} {4},{3} {5},{1}",
    spos[st][0]-offrad_cos, spos[st][1]-offrad_sin, 
    spos[st][0]-offbez_cos, spos[st][1]-offbez_sin, 
    spos[st][0]+offbez_cos, spos[st][0]+offrad_cos)).attr(this.line_params);

  this.drawArrowHead(path);

  this.labelArrow(path, label, label_offx, label_offy);
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


RDFA.prototype.curvedArrow = function(from, to, f_ang, t_ang, curve, label, label_offx, label_offy) {
  var spos = this.spos;

  var from_off_cos = this.off_circ*Math.cos(f_ang);
  var from_off_sin = this.off_circ*Math.sin(f_ang);
  var from_bez_cos = curve*Math.cos(f_ang);
  var from_bez_sin = curve*Math.sin(f_ang);

  var to_off_cos = this.off_circ*Math.cos(t_ang);
  var to_off_sin = this.off_circ*Math.sin(t_ang);
  var to_bez_cos = curve*Math.cos(t_ang);
  var to_bez_sin = curve*Math.sin(t_ang);

  var path = this.paper.path(this.format("M {0},{1} C {2},{3} {4},{5} {6},{7}",
    spos[to][0]+to_off_cos, spos[to][1]-to_off_sin, 
    spos[to][0]+to_bez_cos, spos[to][1]-to_bez_sin,
    spos[from][0]+from_bez_cos, spos[from][1]-from_bez_sin,
    spos[from][0]+from_off_cos, spos[from][1]-from_off_sin)).attr(this.line_params);

  this.drawArrowHead(path);

  this.labelArrow(path, label, label_offx, label_offy);
}




var stepdfa = function(raphDFA, dfaName) {
  var func = function() {
    var next_state = raphDFA.getNextState();
    var prev_state = raphDFA.DFA.current;

    raphDFA.DFA.current = next_state;
    raphDFA.drawState(prev_state);
    raphDFA.drawState(next_state);

    raphDFA.tape.position += 1;
    raphDFA.drawTape(false);

    // disable step button if no more input    
    if(raphDFA.tape.position === raphDFA.tape.input.length) {
      document.getElementById(dfaName+'step').disabled = true;
    }
  }

  return func;
};

var resetdfa = function(raphDFA, dfaName) {
  var func = function() {
    raphDFA.drawTape(true);
    raphDFA.tape.position = 0;
    raphDFA.DFA.current = raphDFA.DFA.initial;

    for(var i = 0; i < raphDFA.DFA.states; i += 1) {
      raphDFA.drawState(i);
    }

    document.getElementById(dfaName+'step').disabled = false;
  }

  return func;
};


var inputdfa = function(raphDFA, dfaName) {
  var func = function(event) {
    event = event || windows.event;
    if(event.keyCode === 13) {
      var input_box = document.getElementById(dfaName+'input');
      var user_input = input_box.value;
      
      // validate user input before sending it to the DFA
      var isValid = true;
      for(var i = 0; i < user_input.length; i += 1) {
        if(raphDFA.inAlphabet(user_input[i]) === false) {
          isValid = false;
          i = user_input.length;
        }
      }

      if(isValid) {
        raphDFA.tape.input = user_input;
        resetdfa(raphDFA, dfaName)();
      } else {
        alert("Dear Sir or Madam: You have entered an invalid input symbol");
      }

      input_box.value = "";
    }
  }

  return func;
}