var TIME_STEP = 0.01;
var MAX_NUM_SHAPES = 500;

var gl;
var shapesOnScreen;
var uTime;
var globalTime;

var autoMode;
var autoModeTimerId;
/*---------------------------------------
Pedro Silvestre n° 48540
Sofia Martins   n° 47508

Implemented:
    -10 different shapes.
    -Separate rotations and blink speeds for every object on screen.
    -Color selection for the objects and the background of the canvas.
    -Color preview.
    -Automatic Mode.
    -Soft Edges on Square, Circle, Ring and Cross.
    -Clear objects button.
-----------------------------------------*/ 



//Shape constructor function.
function Shape(shape, color, pos){
    this.pos = pos;
    this.shape = shape;
    this.color = color;
    this.alphaAngle = (Math.random() * 10.0) + 1.0;
    this.rotDir = Math.round(Math.random())*2 -1; //either 0 or 1
    this.size = (Math.random() * 100.0) + 25.0; //between 125 and 25
    this.blinkSpeed = (Math.random() * 10.0) + 1.0;
}

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    var canvas_preview_color = document.getElementById("gl-canvas-color-preview");
    var preview_context = canvas_preview_color.getContext('2d');
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.5, 0.5, 0.3);
    
    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    globalTime = 0;
    shapesOnScreen = 0;
    autoMode = false;
    uTime = gl.getUniformLocation(program, 'uTime');
    
    //Enable compositing.
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    //Create necessary buffers, and create pointers for attribute variables
    //We decided to use separate buffers for simplicity
    var bufferPosId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosId);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    
    var bufferSizeId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferSizeId);

    var vSize = gl.getAttribLocation(program, "vSize");
    gl.vertexAttribPointer(vSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vSize);
    
    var bufferAlphaAngleId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferAlphaAngleId);
    
    var vAlphaAngle = gl.getAttribLocation(program, "alpha_angle");
    gl.vertexAttribPointer(vAlphaAngle, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vAlphaAngle);

    var bufferShapesId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferShapesId);
    
    var vShapePtr = gl.getAttribLocation(program, "aShape");
    gl.vertexAttribPointer(vShapePtr, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vShapePtr);

    var bufferColorsId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColorsId);
    
    var vColorPtr = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(vColorPtr, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColorPtr);

    var bufferBlinkId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferBlinkId);
    
    var vBlinkPtr = gl.getAttribLocation(program, "aBlink");
    gl.vertexAttribPointer(vBlinkPtr, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vBlinkPtr);
    
    initBuffers();

    //Attaches a listener to the automatic mode button.
    document.getElementById("automaticToggle").onclick =
    function(){
        autoMode = !autoMode;
        if(autoMode)
            autoModeTimerId = window.setInterval(function(){addShape(genShape());}, 500);
        else
            window.clearInterval(autoModeTimerId);

    };

    setPreviewColor();


    //attach listeners to the sliders
    attachListenerToSliders(document.getElementById("rSlider"));
    attachListenerToSliders(document.getElementById("gSlider"));
    attachListenerToSliders(document.getElementById("bSlider"));
    attachListenerToSliders(document.getElementById("aSlider"));

    //Helper function. Attaches setPreviewColor as the listener for the sliders.
    function attachListenerToSliders(slider){
        slider.onchange = 
        function(){
            setPreviewColor();
        }
    };

    //Sets the listener for the background button. Sets it to the value in the sliders.
    document.getElementById("bgButton").onclick =
    function(){
        var redC = document.getElementById("rSlider").value;
        var greenC = document.getElementById("gSlider").value;
        var blueC = document.getElementById("bSlider").value;
        var alphaC = document.getElementById("aSlider").value;

        gl.clearColor(redC, greenC, blueC, alphaC);
    }

    //Sets the listener for the clear button.
    document.getElementById("clearButton").onclick =
    function(){
        initBuffers();
    }
    
    //Initializes and clears the buffers to the correct size.
    function initBuffers(){
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosId);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_SHAPES*2*4, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferSizeId);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_SHAPES*1*4, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferAlphaAngleId);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_SHAPES*1*4, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferShapesId);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_SHAPES*1*4, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferColorsId);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_SHAPES*4*4, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferBlinkId);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_SHAPES*1*4, gl.STATIC_DRAW);
        shapesOnScreen = 0;
    }

    //Sets the color of the color preview rectangle.
    function setPreviewColor(){
        var red = (Math.floor(document.getElementById("rSlider").value*255)).toString();
        var green = (Math.floor(document.getElementById("gSlider").value*255)).toString();
        var blue = (Math.floor(document.getElementById("bSlider").value*255)).toString();
        var alpha = (Math.floor(document.getElementById("aSlider").value*255)).toString();
        preview_context.fillStyle = ('rgba(' + red + ',' + green + ',' + blue + ',' + alpha +')');
        preview_context.fillRect(0 , 0, 200, 50);
    }

    //Set the mouseup listener to create a new shape at the position of the mouse.
    canvas.onmouseup = function(event){
        var shapeObject = genShape();
        var pos = vec2(-1 + 2 * event.offsetX/ canvas.width, -1 + 2 * (canvas.height-event.offsetY) / canvas.height); 
        shapeObject.pos = pos;
        addShape(shapeObject);
    }

    //Generates a random shape object. The color and shape are taken from user input.
    function genShape(){
        var shape = document.getElementById("selectShapeMenu").value;

        var redC = document.getElementById("rSlider").value;
        var greenC = document.getElementById("gSlider").value;
        var blueC = document.getElementById("bSlider").value;
        var alphaC = document.getElementById("aSlider").value;
        
        var color = vec4(redC, greenC, blueC, alphaC);
        pos = vec2((Math.random() * 2.0) - 1.0,(Math.random() * 2) - 1.0);
        return new Shape(shape, color, pos);
    }


    //Receives a shape object and inserts the data into the buffers
    function addShape(shape){
        if(shapesOnScreen != MAX_NUM_SHAPES){
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosId);
            gl.bufferSubData(gl.ARRAY_BUFFER, shapesOnScreen * 2 * 4, flatten(shape.pos));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferSizeId);
            gl.bufferSubData(gl.ARRAY_BUFFER, shapesOnScreen * 1 * 4, flatten([shape.size]));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferAlphaAngleId);
            gl.bufferSubData(gl.ARRAY_BUFFER, shapesOnScreen * 1 * 4, flatten([shape.alphaAngle * shape.rotDir]));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferShapesId);
            gl.bufferSubData(gl.ARRAY_BUFFER, shapesOnScreen * 1 * 4, flatten([shape.shape]));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferColorsId);
            gl.bufferSubData(gl.ARRAY_BUFFER, shapesOnScreen * 4 * 4, flatten(shape.color));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferBlinkId);
            gl.bufferSubData(gl.ARRAY_BUFFER, shapesOnScreen* 1 * 4, flatten([shape.blinkSpeed]));
            
            shapesOnScreen++;
        }
    }
    
    render();
}

function render() {
    globalTime += TIME_STEP;
    gl.uniform1f(uTime, globalTime);

    //Clear screen and redraw everything.
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(shapesOnScreen != 0) //Just to remove warnings.
        gl.drawArrays(gl.POINTS, 0, shapesOnScreen);
    
    requestAnimationFrame(render);
}


