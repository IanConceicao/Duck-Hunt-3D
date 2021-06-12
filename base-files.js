import {defs, tiny} from './examples/common.js';

const {
    Vector,
    Vector3,
    vec,
    vec3,
    vec4,
    color,
    hex_color,
    Shader,
    Phong_Shader,
    Matrix,
    Mat4,
    Light,
    Shape,
    Material,
    Scene,
    Texture
} = tiny;

const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Grid_Patch, Textured_Phong} = defs; 

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

export class Text_Line extends Shape {                           // **Text_Line** embeds text in the 3D world, using a crude texture
    // method.  This Shape is made of a horizontal arrangement of quads.
    // Each is textured over with images of ASCII characters, spelling
    // out a string.  Usage:  Instantiate the Shape with the desired
    // character line width.  Then assign it a single-line string by calling
    // set_string("your string") on it. Draw the shape on a material
    // with full ambient weight, and text.png assigned as its texture
    // file.  For multi-line strings, repeat this process and draw with
    // a different matrix.
constructor(max_size) {
super("position", "normal", "texture_coord");
this.max_size = max_size;
var object_transform = Mat4.identity();
for (var i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
defs.Square.insert_transformed_copy_into(this, [], object_transform);
object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
}
}

set_string(line, context) {           // set_string():  Call this to overwrite the texture coordinates buffer with new
// values per quad, which enclose each of the string's characters.
this.arrays.texture_coord = [];
for (var i = 0; i < this.max_size; i++) {
var row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

var skip = 3, size = 32, sizefloor = size - skip;
var dim = size * 16,
left = (col * size + skip) / dim, top = (row * size + skip) / dim,
right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
[left, 1 - top], [right, 1 - top]));
}
if (!this.existing) {
this.copy_onto_graphics_card(context);
this.existing = true;
} else
this.copy_onto_graphics_card(context, ["texture_coord"], false);
}
}

export class Texture_Scroll_X extends Textured_Phong {
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                float offset = 0.01*animation_time;

                vec4 tex_color = texture2D( texture, vec2((f_tex_coord.x-offset)/0.2,f_tex_coord.y/0.5));
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

export class Texture_Rotate extends Textured_Phong {
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                float offset = 0.02*animation_time;

                vec4 tex_color = texture2D( texture, vec2((f_tex_coord.x)/0.2,f_tex_coord.y/0.5));
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

export class Shape_From_File extends Shape {                                   // **Shape_From_File** is a versatile standalone Shape that imports
    // all its arrays' data from an .obj 3D model file.
constructor(filename) {
super("position", "normal", "texture_coord");
// Begin downloading the mesh. Once that completes, return
// control to our parse_into_mesh function.
this.load_file(filename);
}

load_file(filename) {                             // Request the external file and wait for it to load.
// Failure mode:  Loads an empty shape.
return fetch(filename)
.then(response => {
if (response.ok) return Promise.resolve(response.text())
else return Promise.reject(response.status)
})
.then(obj_file_contents => this.parse_into_mesh(obj_file_contents))
.catch(error => {
this.copy_onto_graphics_card(this.gl);
})
}

parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
var verts = [], vertNormals = [], textures = [], unpacked = {};

unpacked.verts = [];
unpacked.norms = [];
unpacked.textures = [];
unpacked.hashindices = {};
unpacked.indices = [];
unpacked.index = 0;

var lines = data.split('\n');

var VERTEX_RE = /^v\s/;
var NORMAL_RE = /^vn\s/;
var TEXTURE_RE = /^vt\s/;
var FACE_RE = /^f\s/;
var WHITESPACE_RE = /\s+/;

for (var i = 0; i < lines.length; i++) {
var line = lines[i].trim();
var elements = line.split(WHITESPACE_RE);
elements.shift();

if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
else if (FACE_RE.test(line)) {
var quad = false;
for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
if (j === 3 && !quad) {
j = 2;
quad = true;
}
if (elements[j] in unpacked.hashindices)
unpacked.indices.push(unpacked.hashindices[elements[j]]);
else {
var vertex = elements[j].split('/');

unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

if (textures.length) {
unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
}

unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

unpacked.hashindices[elements[j]] = unpacked.index;
unpacked.indices.push(unpacked.index);
unpacked.index += 1;
}
if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
}
}
}
{
const {verts, norms, textures} = unpacked;
for (var j = 0; j < verts.length / 3; j++) {
this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
}
this.indices = unpacked.indices;
}
this.normalize_positions(false);
this.ready = true;
}

draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
// attempts to draw the shape before it loads:
if (this.ready)
super.draw(context, program_state, model_transform, material);
}
}


export class Blade {
    
    constructor(start_x,start_z,i, j, gridsize_x,gridsize_z, angle_amplitude, angle_period,copy_blade) {

        this.copy_blade = copy_blade; //If this is not null, then we will be using all but the translations of our 'copy_blade'

        let variation_x = getRandomArbitrary(-gridsize_x / 3, gridsize_x / 3);
        let variation_z = getRandomArbitrary(-gridsize_z / 3, gridsize_z / 3);

        this.angle_offset = getRandomArbitrary(-angle_amplitude, angle_amplitude);
        this.period_offset = getRandomArbitrary(-angle_period/7,angle_period/7)
        this.angle_amplitude = angle_amplitude;
        this.angle_period = angle_period;
        this.x_val = start_x + variation_x + gridsize_x * i;
        this.z_val = start_z + variation_z + gridsize_z * j;
        this.height_scale = getRandomArbitrary(1.2, 1.6);
        this.width_scale = getRandomArbitrary(1, 1.3);
        let random_red = 0.05 + getRandomArbitrary(-0.05,0.05)
        let random_green = 0.5 + getRandomArbitrary(-0.1,0.1)
        let random_blue = 0.1 + getRandomArbitrary(-0.1,0.1)
        this.color = color(random_red,random_green,random_blue,1);

        //Used so we do not always have to update
        this.cached_transform_mat4 = null; 
        this.cached_rotation_mat4 = null;
        this.update_freq = 5; //Update model every n frames
        this.update_num = getRandomInt(0,this.update_freq)

        //Cache the scaled matrix so we do not need to recompute every frame
        this.cached_scale_mat4 = null;
    }

    should_update(frame_count){
        /*
        Takes a frame_count of type integer, and decides based off that whether the model should be updated
        */
       if(this.cached_transform_mat4 == null || frame_count % this.update_freq == this.update_num){ //If it is our turn, let's update!
           return true;
       }
       else{
           return false;
       }
    }

    get_angle(t) {
        return this.angle_amplitude * (Math.sin((2 * Math.PI) / this.angle_period * t + this.period_offset) + this.angle_offset);
    }

    get_position() {
        return vec3(this.x_val, 0, this.z_val)
    }

    get_color(){
        return this.color;
    }

}

export class Tree extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");
        //Math.floor(Math.random() * 25); 
        let startX = 0//Math.floor(Math.random() * 25)-12.5;
        let startZ = 0//Math.floor(Math.random() * 25)-12.5;
        let angle1 = Math.random();
        let angle2 = Math.random();
        let scale1 = Math.floor(Math.random() * 2)+1; 
        let reduceFactor = (Math.random()*0.5)+0.5;

        let height1 = Math.floor(Math.random() * 3)+2;
        let height2 = Math.floor(Math.random() * 2)+1;
        let height3 = Math.random()+1;
        let height4 = Math.floor(Math.random() * 2)+2;
        let currHeight = 0;

        let square_array1 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);
        let square_array2 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);
        let square_array3 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);
        let square_array4 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);
        let square_array5 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);
        let square_array6 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);
        let square_array7 = Vector3.cast([startX+1, 0, startZ-1], [startX-1, 0, startZ-1], [startX-1, 0, startZ+1], [startX+1, 0, startZ+1],[startX+1, 0, startZ-1]);

        square_array1 = square_array1.map((x, i, a) =>
            a[i] = Mat4.translation(0, 0, 0)
                .times(Mat4.scale(scale1,1,scale1))
                .times(Mat4.rotation(0.0 * Math.PI, 0, 0, 1))
                .times(x.to4(1)).to3());

        currHeight += height1;
        square_array2 = square_array2.map((x, i, a) =>
            a[i] = Mat4.translation(0, currHeight, 0)
                .times(Mat4.scale(reduceFactor,1,reduceFactor))
                .times(Mat4.rotation(angle1, 0, currHeight, 1))
                .times(x.to4(1)).to3());

        currHeight += height2;
        square_array3 = square_array3.map((x, i, a) =>
            a[i] = Mat4.translation(0, currHeight, 0)
                .times(Mat4.scale(reduceFactor*0.8,1,reduceFactor*0.8))
                .times(Mat4.rotation(angle2, -1, 0, 0))
                .times(x.to4(1)).to3());

        currHeight += height3;
        square_array4 = square_array4.map((x, i, a) =>
            a[i] = Mat4.translation(0, currHeight, 0)
                .times(Mat4.scale(reduceFactor*0.7,1,reduceFactor*0.7))
                .times(Mat4.rotation(0.0 * Math.PI, 0, 1, 0))
                .times(x.to4(1)).to3());

        currHeight += height4;

        let branchHeight1 = currHeight +(Math.random() * 2);
        let branch1_x = startX+((Math.random()*4)+2);
        let branch1_z = startZ+(Math.random()*7);
        square_array5 = square_array5.map((x, i, a) =>
            a[i] = Mat4.rotation(0.0 * Math.PI, 1, 1, 0)
                .times(Mat4.translation(branch1_x, branchHeight1, branch1_z))
                .times(x.to4(1)).to3());

        let branchHeight2 = currHeight +(Math.random() * 2);
        let branch2_x = startX-((Math.random()*4)+2);
        let branch2_z = startZ+(Math.random()*7);
        square_array6 = square_array6.map((x, i, a) =>
            a[i] = Mat4.rotation(0.0 * Math.PI, 1, 1, 0)
                .times(Mat4.translation(branch2_x, branchHeight2, branch2_z))
                .times(x.to4(1)).to3());

        let branchHeight3 = currHeight +(Math.random() * 2);
        let branch3_x = startX+((Math.random()*4)-2);
        let branch3_z = startZ-(Math.random()*7);
        square_array7 = square_array7.map((x, i, a) =>
            a[i] = Mat4.rotation(0.0 * Math.PI, 1, 1, 0)
                .times(Mat4.translation(branch3_x, branchHeight3, branch3_z))
                .times(x.to4(1)).to3());

        let sampler1 = i => defs.Grid_Patch.sample_array(square_array1, i);
        let sampler2 = i => defs.Grid_Patch.sample_array(square_array2, i);
        let sampler3 = i => defs.Grid_Patch.sample_array(square_array3, i);
        let sampler4 = i => defs.Grid_Patch.sample_array(square_array4, i)
        let sampler5 = i => defs.Grid_Patch.sample_array(square_array5, i)
        let sampler6 = i => defs.Grid_Patch.sample_array(square_array6, i)
        let sampler7 = i => defs.Grid_Patch.sample_array(square_array7, i)

        let sample_two_arrays = (j, p, i) => sampler2(i).mix(sampler1(i), j);
        let sample_two_arrays2 = (j, p, i) => sampler3(i).mix(sampler2(i), j);
        let sample_two_arrays3 = (j, p, i) => sampler4(i).mix(sampler3(i), j);
        let sample_two_arrays4 = (j, p, i) => sampler5(i).mix(sampler4(i), j);
        let sample_two_arrays5 = (j, p, i) => sampler6(i).mix(sampler4(i), j);
        let sample_two_arrays6 = (j, p, i) => sampler7(i).mix(sampler4(i), j);


        Grid_Patch.insert_transformed_copy_into(this, [30, 30, sampler2, sample_two_arrays, [[0, 1], [0, 1]]]);
        Grid_Patch.insert_transformed_copy_into(this, [30, 30, sampler3, sample_two_arrays2, [[0, 1], [0, 1]]]);
        Grid_Patch.insert_transformed_copy_into(this, [30, 30, sampler4, sample_two_arrays3, [[0, 1], [0, 1]]]);
        Grid_Patch.insert_transformed_copy_into(this, [30, 30, sampler5, sample_two_arrays3, [[0, 1], [0, 1]]]);
        Grid_Patch.insert_transformed_copy_into(this, [30, 30, sampler6, sample_two_arrays3, [[0, 1], [0, 1]]]);
        Grid_Patch.insert_transformed_copy_into(this, [30, 30, sampler7, sample_two_arrays3, [[0, 1], [0, 1]]]);

        this.branchPos = [[branch1_x,branchHeight1,branch1_z],[branch2_x,branchHeight2,branch2_z],[branch3_x,branchHeight3,branch3_z]];
    }
}

export class Bird {

    constructor(start_position,creation_time,dir){
        this.position = start_position;
        this.creation_time = creation_time;
        this.velocity = vec3(dir*0.05,0,0);
        //this.velocity = vec3(0,0,0); //Make birds still for testing
        
        //Needs a center vector, running through its body for collision detection
        this.body_vector = null; //Will be set 
        this.tail_point = null;
        this.lw_vector = null;
        this.rw_vector = null;
        this.center_point = null;
        this.body_collision_radius = 0.5;
        this.wing_collision_radius = 0.3;
        this.direction = dir;
    }

    set_vectors(bk,bod,lw,rw){
        /*
        Sets the body vector field according to the transformation matrices bk (beak) and bod (body)
        The body vector is an important vector for approximating collisions
        Also does the similar for lw and rw
        */
        
        let origin = vec4(0,0,0,1);
        let beak_point = bk.times(origin);
        let tail_point = bod.times(origin); //Approximate of tail, really just body but it's fine because we will use a 'capsule' method
        let body_vector = beak_point.minus(tail_point);

        this.tail_point = tail_point;
        this.body_vector = body_vector; //The vector we need for collisions        

        beak_point = beak_point.to3();
        tail_point = tail_point.to3();
        let center_point = beak_point.times(0.3).plus(tail_point.times(0.7));
        this.center_point = center_point.to4();
        
        let lw_point = lw.times(origin);
        let rw_point = rw.times(origin);

        this.lw_vector = lw_point.minus(this.center_point);
        this.rw_vector = rw_point.minus(this.center_point);
    }

    draw(context, program_state, t, shapes, materials){ 
        
        let time_diff = t - this.creation_time;
        this.position = Mat4.translation(this.velocity[0],this.velocity[1],this.velocity[2]).times(this.position)
        let model_transform = Mat4.translation(0,Math.sin(2*time_diff),0).times(this.position)

        let rot = model_transform.times(Mat4.scale(1.2,1.2,1.2)).times(Mat4.rotation(0.6*Math.sin(2*time_diff),0,0,1));
        let rot1 = model_transform.times(Mat4.scale(1.2,1.2,1.2)).times(Mat4.rotation(-0.6*Math.sin(2*time_diff),0,0,1));
        let lw = rot.times(Mat4.translation(-2,0.6,0.8));
        let rw = rot1.times(Mat4.scale(-1,1,1)).times(Mat4.translation(-2,0.6,0.8));
        let bod = model_transform.times(Mat4.scale(1.1,1.1,1.1)).times(Mat4.translation(0,0,-1));

        shapes.body.draw(context, program_state, bod, materials.body);
        shapes.wing.draw(context, program_state, lw, materials.body);
        shapes.wing.draw(context, program_state, rw, materials.body);
        
        let nk = model_transform.times(Mat4.translation(0,0,2)).times(Mat4.scale(1/2,1/2,1/2));
        shapes.neck.draw(context, program_state, nk, materials.neck);
        let hd = model_transform.times(Mat4.translation(0,-0.5,3.75)).times(Mat4.scale(1/2,1/2,1/2)).times(Mat4.rotation(Math.PI/2,1,0,0));
        shapes.head.draw(context, program_state, hd, materials.head);
        let bk = model_transform.times(Mat4.translation(0,-0.65,4.7)).times(Mat4.scale(0.45,0.45,0.45));
        shapes.beak.draw(context, program_state, bk, materials.peak);
        let ey = model_transform.times(Mat4.translation(0,-0.23,4)).times(Mat4.scale(1/2,1/2,1/2));
        shapes.eyes.draw(context, program_state, ey, materials.eye);
        
        return [bk,bod,lw,rw];
    }

    does_collide(projectile){
        //Find closest point on body_vector to center of sphere
        //If the distance is less than cylinder radius + sphere radius then return true

        //First sanity check
        let origin = vec4(0,0,0,1);
        let proj_pos = projectile.position.times(origin);
        let bird_pos = this.center_point;
        let body_vec_size = Math.pow(Math.pow(this.body_vector[0],2)+Math.pow(this.body_vector[1],2)+Math.pow(this.body_vector[2],2),0.5);
        let dist = Math.pow(Math.pow(proj_pos[0]-bird_pos[0],2)+Math.pow(proj_pos[1]-bird_pos[1],2)+Math.pow(proj_pos[2]-bird_pos[2],2),0.5);
        if(dist > body_vec_size + this.body_collision_radius + projectile.radius ){
            return false;
        }

        //Then do actual check
        //Find distance of point to line
        let d1 = this.distance_point_to_line(projectile.position,this.tail_point,this.body_vector);
        let d2 = this.distance_point_to_line(projectile.position,this.center_point,this.lw_vector);
        let d3 = this.distance_point_to_line(projectile.position,this.center_point,this.rw_vector);
        
        for(let distance of [d1,d2,d3]){
            if(distance == d1 && distance < this.body_collision_radius + projectile.radius){
                return true;
            }
            if((distance == d2 || distance == d3) && distance < this.wing_collision_radius + projectile.radius){
                return true;
            }
        }
        return false;

    }

    distance_point_to_line(point_transform,endpoint_of_line,vector_of_line){

        //Use the distance formula: d(p,l) = |(pq) x u|/|u|
        //Where:
            // p is the point (will be center of our sphere)
            // l is the line as expressed as q + tu,
            // q is the starting point of the vector
            // u is the vector
            // pq is the vector from p to q

        let origin = vec4(0,0,0,1);
        let p = point_transform.times(origin); //Perform transformations to origin to get the correct point
        let q =  endpoint_of_line;
        let u = vector_of_line;

        let pq = q.minus(p);
        //Transform from homogenous to vec3 representation
        pq = pq.to3();
        u = u.to3();
        return (pq.cross(u).norm()) / u.norm();
    }
}

export class Projectile{
    
    constructor(start_point,end_point,creation_time,shape,diameter,material){
        this.start_point = start_point; //Vec3
        this.end_point = end_point; //Vec3
        this.position = null; //Transformation Mat4

        this.creation_time = creation_time;
        this.shape = shape;
        this.material = material;
        this.diameter = diameter;
        this.radius = diameter/2;

        this.update_position(creation_time);
    }

    update_position(t){
        //Updates position of projectile
        let delta_t = t - this.creation_time;
        let gun = Mat4.identity();
        gun = gun.times(Mat4.scale(1/2,1/2,1/2))
        this.position = gun.times(Mat4.translation(this.start_point[0]*(1-3*delta_t)+this.end_point[0]*3*delta_t,this.start_point[1]*(1-3*delta_t)+this.end_point[1]*3*delta_t  ,this.start_point[2]*(1-3*delta_t)+this.end_point[2]*3*delta_t));
    }

    draw(context, program_state){
        this.shape.draw(context, program_state, this.position, this.material);
    }

}
