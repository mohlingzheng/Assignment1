// Program Setup
var canvas;
var gl;
var program;

var points = [];
var colors = [];

const baseSplitNum = 3;
var NumTimesToSubdivide = baseSplitNum;

const baseSpeed = 1.0;
var speed = baseSpeed;

// Rotation
const baseRotateSpeed = 1.0;
const axis = 2;
var theta = [ 0, 0, 0 ]
var rotateAngle = baseRotateSpeed;
var thetaLoc;

// Scaling
const baseScale = 0.3;
const baseEnlargeSpeed = 0.002;
const finalEnlargement = 1.5;
var scale = baseScale;
var enlargeSpeed = 0.002;
var scaleLoc;

// Movement
const baseMovementSpeed = 0.005;
const horizontalBoundary = 1 - (0.8165 * baseScale * finalEnlargement);
const verticalTopBoundary = 1 - (0.9428 * baseScale * finalEnlargement);
const verticalBottomBoundary = -(1 - (0.4714 * baseScale * finalEnlargement));
var horizontal = 0;
var vertical = 0;
var movement = vec3( 0.0, 0.0, 0.0 );
var movementSpeed = baseMovementSpeed;
var movementLoc;


// Animation Stage
const StandBy = 0;
const RotateRight = 1;
const RotateLeft = 2;
const ReturnOriginal = 3;
const Enlarging = 4;
const ReturnEnlarge = 5;
const RandomTransition = 6;
const EndStage = 7;
var animationState;
var stage = StandBy;

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
    // gl.clearColor( 1.0, 1.0, 1.0, 0.0 );

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
    movementLoc = gl.getUniformLocation(program, "movement");

}

function buttonInteraction()
{
    document.getElementById("start").onclick = function()
    {
        stage = RotateRight;
        // stage = RandomTransition;
        animation();
        document.getElementById("start").disabled = true;
		document.getElementById("stop").disabled = false;
        document.getElementById("reset").disabled = true;
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
        document.getElementById("reset").disabled = false;
        document.getElementById("split").disabled = false;
        document.getElementById("speed").disabled = false;
        document.getElementById("color1").disabled = false;
        document.getElementById("color2").disabled = false;
        document.getElementById("color3").disabled = false;
        resetDefault();
        buildShape();
    }

    document.getElementById("reset").onclick = function()
    {
        document.getElementById("split").value = baseSplitNum;
        document.getElementById("split-text").value = baseSplitNum;
        document.getElementById("speed").value = baseSpeed;
        document.getElementById("speed-text").value = baseSpeed;
        document.getElementById("color1").value = "#ff0000";
        document.getElementById("color2").value = "#00ff00";
        document.getElementById("color3").value = "#0000ff";
        newColor = [
            vec3(1.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0),
            vec3(0.0, 0.0, 1.0),
            vec3(0.0, 0.0, 0.0)
        ];
        NumTimesToSubdivide = baseSplitNum;
        speed = baseSpeed;
        resetDefault();
        buildShape();
    }

    document.getElementById("split").onchange = function()
    {
        NumTimesToSubdivide = this.value;
        document.getElementById("split-text").value = this.value;
        buildShape();
    }

    document.getElementById("split-text").onchange = function()
    {
        NumTimesToSubdivide = this.value;
        document.getElementById("split").value = this.value;
        buildShape();
    }

    document.getElementById("speed").onchange = function()
    {
        speed = this.value;
        rotateAngle = baseRotateSpeed * speed;
        enlargeSpeed = baseEnlargeSpeed * speed;
        movementSpeed = baseMovementSpeed * speed;
        document.getElementById("speed-text").value = this.value;
    }

    document.getElementById("speed-text").onchange = function()
    {
        speed = this.value;
        rotateAngle = baseRotateSpeed * speed;
        enlargeSpeed = baseEnlargeSpeed * speed;
        movementSpeed = baseMovementSpeed * speed;
        document.getElementById("speed").value = this.value;
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

function resetDefault(){
    rotateAngle = baseRotateSpeed * speed;
    enlargeSpeed = baseEnlargeSpeed * speed;
    movementSpeed = baseMovementSpeed * speed;
    theta[axis] = 0;
    stage = StandBy;
    movement = vec3(0.0, 0.0, 0.0);
    scale = baseScale;
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
            stage = ReturnOriginal;
        }
    }
    else if(stage == ReturnOriginal){
        theta[axis] += rotateAngle;
        if(theta[axis] + rotateAngle >=0){
            rotateAngle = 0;
            stage = Enlarging;
            theta[axis] = 0
        }
    }
    else if(stage == Enlarging){
        scale += enlargeSpeed;
        if(scale >= baseScale*finalEnlargement){
            enlargeSpeed = -enlargeSpeed;
            stage = RandomTransition;
        }
    }
    else if(stage == ReturnEnlarge){
        scale += enlargeSpeed;
        if(scale + enlargeSpeed <= baseScale){
            enlargeSpeed = 0
            stage = RandomTransition;
            scale = baseScale;
        }
    }
    else if(stage == RandomTransition){
        if(horizontal == 0){
            if(movement[0] - movementSpeed <= -horizontalBoundary){
                movement[0] += movementSpeed;
                horizontal = 1;
            }
            else{
                movement[0] -= movementSpeed;
            }    
        }
        if(horizontal == 1){
            if(movement[0] + movementSpeed >= horizontalBoundary){
                movement[0] -= movementSpeed;
                horizontal = 0;
            }
            else{
                movement[0] += movementSpeed;
            }    
        }
        if(vertical == 0){
            if(movement[1] - movementSpeed <= verticalBottomBoundary){
                movement[1] += movementSpeed;
                vertical = 1;
            }
            else{
                movement[1] -= movementSpeed;
            }    
        }
        if(vertical == 1){
            if(movement[1] + movementSpeed >= verticalTopBoundary){
                movement[1] -= movementSpeed;
                vertical = 0;
            }
            else{
                movement[1] += movementSpeed;
            }    
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
    gl.uniform3fv(movementLoc, movement);

    gl.drawArrays( gl.TRIANGLES, 0, points.length );

    requestAnimFrame( render );
}
