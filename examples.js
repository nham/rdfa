// some globals
var circ_rad = 22;
var off_circ = circ_rad + 3;


// EIZ DFA
eizDFA = {
  input: "0101101110",
  states: 2,
  alphabet: ['0', '1'],
  transitions: [{'0': 0, '1': 1}, 
                {'0': 0, '1': 1}],
  initial: 0,
  accepts: [0],
  
  dfa_name: "dfa1",
  width: 270,
  height: 125,

  spos: [[70, 90], [200, 90]],
  circ_rad: circ_rad,
  line_params: {"stroke-width": 2}
}

var eiz = new RDFA(eizDFA); 

// transition arrows
eiz.initialArrow(0, Math.PI, 50);
eiz.selfArrow(0, "t", "0", 0, -8);
eiz.selfArrow(1, "t", "1", 0, -8);
eiz.curvedArrow(0, 1, 5*Math.PI/36, 31*Math.PI/36, 50, "1", 0, -8);
eiz.curvedArrow(1, 0, 41*Math.PI/36, 67*Math.PI/36, 50, "0", 0, 8);

// Attach handlers
document.getElementById('eizstep').onclick = stepdfa(eiz, "eiz");
document.getElementById('eizreset').onclick = resetdfa(eiz, "eiz");
document.getElementById('eizinput').onkeyup = inputdfa(eiz, "eiz");



// 666 DFA
twoDFA = {
  input: "6776766676",
  states: 6,
  alphabet: ['6', '7'],
  transitions: [{'7': 1, '6': 3},
                {'7': 2, '6': 3},
                {'7': 2, '6': 3},
                {'7': 2, '6': 4},
                {'7': 2, '6': 5},
                {'7': 5, '6': 5}],
  initial: 0,
  accepts: [1, 5],

  dfa_name: "two",
  width: 450,
  height: 250,
   
  spos: [[60, 90], [60, 180], [170, 180], [170, 90], [280, 90], [390, 90]],
  circ_rad: circ_rad,
  line_params: {"stroke-width": 2}
}

var two = new RDFA(twoDFA);

// transition arrows
two.initialArrow(0, Math.PI, 50);
two.selfArrow(5, "t", "6,7", 0, -8);
two.selfArrow(2, "b", "7", 0, 8);
two.straightArrow(0, 1, 3*Math.PI/2, Math.PI/2, "7", -8, 0);
two.straightArrow(0, 3, 0, Math.PI, "6", 0, -8);
two.straightArrow(1, 2, 0, Math.PI, "7", 0, -8);
two.straightArrow(3, 4, 0, Math.PI, "6", 0, -8);
two.straightArrow(4, 5, 0, Math.PI, "6", 0, -8);
two.straightArrow(1, 3, Math.PI/4, 5*Math.PI/4, "6", -6, -6);
two.straightArrow(4, 2, 5*Math.PI/4, Math.PI/4, "7", 6, 6);
two.curvedArrow(2, 3, 13*Math.PI/36, 59*Math.PI/36, 40, "6", 8, 0);
two.curvedArrow(3, 2, 49*Math.PI/36, 23*Math.PI/36, 40, "7", -8, 0);

// Attach handlers
document.getElementById('twostep').onclick = stepdfa(two, "two");
document.getElementById('tworeset').onclick = resetdfa(two, "two");
document.getElementById('twoinput').onkeyup = inputdfa(two, "two");