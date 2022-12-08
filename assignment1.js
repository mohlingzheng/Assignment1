// Program Setup
var canvas;
var gl;
var program;

var points = [];
var colors = [];

var NumTimesToSubdivide = 3;

var speed = 1.0;

// Rotation
var axis = 2;
var theta = [ 0, 0, 0 ]
const baseRotateSpeed = 1.0;
var rotateAngle = 1.0;
var thetaLoc;

// Scaling
var scale = 0.5;
const baseScale = 0.5;
const baseEnlargeSpeed = 0.002;
var enlargeSpeed = 0.002;
var scaleLoc;

var animationState;

var count = 0;

var stage = 0;
const StandBy = 0;
const RotateRight = 1;
const RotateLeft = 2;
const RotateRight2 = 3;
const Enlarging = 4;
const ReturnEnlarge = 5;
const EndStage = 6;

const vertices = [
    vec3(  0.0000,  0.0000, -1.0000 ),
    vec3(  0.0000,  0.9428,  0.3333 ),
    vec3( -0.8165, -0.4714,  0.3333 ),
    vec3(  0.8165, -0.4714,  0.3333 )
];

const baseColors = [
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 0.0, 0.0)
];
var newColor = baseColors;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);

    buttonInteraction();

    buildShape()

    render();
};

function WebGLSetup()
{
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    scaleLoc = gl.getUniformLocation(program, "scale");
}

function buttonInteraction()
{
    document.getElementById("start").onclick = function()
    {
        stage = RotateRight;
        animation();
        document.getElementById("start").disabled = true;
		document.getElementById("stop").disabled = false;
        document.getElementById("split").disabled = true;
        document.getElementById("speed").disabled = true;
        document.getElementById("color1").disabled = true;
        document.getElementById("color2").disabled = true;
        document.getElementById("color3").disabled = true;
    }

    document.getElementById("stop").onclick = function()
    {
        window.cancelAnimationFrame(animationState);
        document.getElementById("start").disabled = false;
		document.getElementById("stop").disabled = true;
        document.getElementById("split").disabled = false;
        document.getElementById("speed").disabled = false;
        document.getElementById("color1").disabled = false;
        document.getElementById("color2").disabled = false;
        document.getElementById("color3").disabled = false;
        rotateAngle = baseRotateSpeed * speed;
        scale = baseScale;
        enlargeSpeed = baseEnlargeSpeed * speed;
        theta[axis] = 0;
    }

    document.getElementById("split").onchange = function()
    {
        NumTimesToSubdivide = this.value;
        console.log(this.value);
        buildShape();
    }

    document.getElementById("speed").onchange = function()
    {
        speed = this.value;
        rotateAngle = baseRotateSpeed * speed;
        enlargeSpeed = baseEnlargeSpeed * speed;
        console.log(this.value)
    }

    document.getElementById("color1").onchange = function()
    {
        var tempColor = this.value;
        var rgb = convertHexToRGB(tempColor);
        newColor[0][0] = rgb.x;
        newColor[0][1] = rgb.y;
        newColor[0][2] = rgb.z;
        buildShape();
    }

    document.getElementById("color2").onchange = function()
    {
        var tempColor = this.value;
        var rgb = convertHexToRGB(tempColor);
        newColor[1][0] = rgb.x;
        newColor[1][1] = rgb.y;
        newColor[1][2] = rgb.z;
        buildShape();
    }

    document.getElementById("color3").onchange = function()
    {
        var tempColor = this.value;
        var rgb = convertHexToRGB(tempColor);
        newColor[2][0] = rgb.x;
        newColor[2][1] = rgb.y;
        newColor[2][2] = rgb.z;
        buildShape();
    }
}

function buildShape()
{
    points = []
    colors = []
    divideTetra( vertices[0], vertices[1], vertices[2], vertices[3],
        NumTimesToSubdivide);
    WebGLSetup()
    render()
}

function convertHexToRGB(tempColor){
    var rgb = new vec3();
    rgb.x =(parseInt(tempColor.slice(1,3), 16) / 255);
    rgb.y =(parseInt(tempColor.slice(3,5), 16) / 255);
    rgb.z =(parseInt(tempColor.slice(5,7), 16) / 255);;
    return rgb;
}

function animation()
{
    if(stage == RotateRight){
        theta[axis] += rotateAngle;
        if(theta[axis] >= 180){
            rotateAngle = -rotateAngle;
            stage = RotateLeft;
        }
    }
    else if(stage == RotateLeft){
        theta[axis] += rotateAngle;
        if(theta[axis] <= -180){
            rotateAngle = -rotateAngle;
            stage = RotateRight2;
        }
    }
    else if(stage == RotateRight2){
        theta[axis] += rotateAngle;
        if(theta[axis] + rotateAngle >=0){
            rotateAngle = 0;
            stage = Enlarging;
            theta[axis] = 0
        }
    }
    else if(stage == Enlarging){
        scale += enlargeSpeed;
        if(scale >= baseScale*2){
            enlargeSpeed = -enlargeSpeed;
            stage = ReturnEnlarge;
        }
    }
    else if(stage == ReturnEnlarge){
        scale += enlargeSpeed;
        if(scale + enlargeSpeed <= baseScale){
            enlargeSpeed = 0
            stage = EndStage;
            scale = baseScale;
        }
    }
    else if(stage == EndStage){
        stage = RotateRight;
        rotateAngle = baseRotateSpeed * speed;
        scale = baseScale;
        enlargeSpeed = baseEnlargeSpeed * speed;
    }
    animationState = requestAnimFrame(animation);
}

function triangle( a, b, c, color )
{

    // add colors and vertices for one triangle

    colors.push( newColor[color] );
    points.push( a );
    colors.push( newColor[color] );
    points.push( b );
    colors.push( newColor[color] );
    points.push( c );
}

function tetra( a, b, c, d )
{
    // tetrahedron with each side using
    // a different color
    
    triangle( a, c, b, 0 );
    triangle( a, c, d, 1 );
    triangle( a, b, d, 2 );
    triangle( b, c, d, 3 );
}

function divideTetra( a, b, c, d, count )
{
    // check for end of recursion
    
    if ( count === 0 ) {
        tetra( a, b, c, d );
    }
    
    // find midpoints of sides
    // divide four smaller tetrahedra
    
    else {
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var ad = mix( a, d, 0.5 );
        var bc = mix( b, c, 0.5 );
        var bd = mix( b, d, 0.5 );
        var cd = mix( c, d, 0.5 );

        --count;
        
        divideTetra(  a, ab, ac, ad, count );
        divideTetra( ab,  b, bc, bd, count );
        divideTetra( ac, bc,  c, cd, count );
        divideTetra( ad, bd, cd,  d, count );
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1f(scaleLoc, scale)
    gl.uniform3fv(thetaLoc, theta);

    gl.drawArrays( gl.TRIANGLES, 0, points.length );

    requestAnimFrame( render );
}
