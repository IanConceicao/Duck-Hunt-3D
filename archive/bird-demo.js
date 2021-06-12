import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material,Texture, Scene,
} = tiny;

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

    draw(context, program_state, model_transform, material) {              
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}



//Custom Code Starts here
//----------------------

class Bird {

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
        
        //First find distance of point to line

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

class Projectile{
    
    constructor(start_position,creation_time,velocity,shape,diameter,material,dir_vector){
        this.position = start_position.times(Mat4.scale(diameter,diameter,diameter));
        this.creation_time = creation_time;
        this.initial_velocity = velocity;
        this.velocity = velocity; 
        this.shape = shape;
        this.material = material;
        this.dir_vector = dir_vector; 
        this.diameter = diameter;
        this.radius = diameter/2;
    }

    update_position(t){
        //Updates position of projectile
        let delta_t = t - this.creation_time;
        this.velocity = vec3(this.initial_velocity[0],this.initial_velocity[1]-0.2*delta_t,this.initial_velocity[2]); //Make it in the direction of the camera
                                                        //Can get a parameter in the constructor of camera position and save it
        this.position = Mat4.translation(this.velocity[0],this.velocity[1],this.velocity[2]).times(this.position);
    }

    draw(context, program_state){
        this.shape.draw(context, program_state, this.position, this.material);
    }

}


export class Bird_Demo extends Scene {
    constructor() {
        super();
        
        //Scene Variables
        //---------------------

        //Bird Relevant Vars
        this.bird_list = [];
        this.startTime = 0;
        this.initial_bird_made = false; //Used for debugging by Ian. Always makes sure a bird spawns right away

        //Projectile Relevant Vars
        this.projectile_list = [];
        this.shoot = false; //If in this frame user requests to shoot
        this.last_shot_t = null;
        this.projectile_refresh_time = 2.5; //How many seconds until we can shoot a new projectile
        this.projectile_life_time = 3.5; //How many seconds a projectile can live for

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
        
            sphere: new defs.Subdivision_Sphere(4),
            eyes: new Shape_From_File("assets/eyes.obj"),
            body: new Shape_From_File("assets/body.obj"),
            beak: new Shape_From_File("assets/beak.obj"),
            neck: new Shape_From_File("assets/neck.obj"),
            wing: new Shape_From_File("assets/wing.obj"),
            head: new Shape_From_File("assets/head.obj"),

        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            eye: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1, color: hex_color("#080808")}),
            neck: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1, color: hex_color("#FDFDFD")}),
            peak: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: 1, color: hex_color("#FFB544")}),
            body: new Material(new defs.Phong_Shader(),
                {ambient: 0.6, diffusivity: 1, specularity: 0.1, color: hex_color("#36250d")}),
            head: new Material(new defs.Phong_Shader(),
                {ambient: 0.6, diffusivity: 1, specularity: 0.1, color: hex_color("#d1c2ce")}),
        }
        
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 50), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Shoot", ["c"], () => { this.shoot = true; });
        this.new_line();
    }
    

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);
        
        const light_position = vec4(10, 10, 10, 1);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const i = Math.cos(t) + 2;

        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];

        let model_transform = Mat4.identity();
        
        //Create New Projectiles
        if(this.shoot){
            
            this.shoot = false;

            //If we are allowed to shoot a projectile, create 1
            if(this.last_shot_t == null || t - this.last_shot_t > this.projectile_refresh_time){
                this.last_shot_t = t;
                
                let starting_pos = Mat4.translation(0,-1,0).times(program_state.camera_transform);  
                let initial_velocity = vec3(0,0.05,-0.5); //TODO: Let the initial velocity be all constants and then multiply by normalized direction of camera, not sure how to do this
                let new_projectile = new Projectile(starting_pos,t,initial_velocity,this.shapes.sphere,0.8,this.materials.test,vec3(0,10,20));
                this.projectile_list.push(new_projectile);
            }

        }
                
        //Update and Draw Projectiles
        for(let projectile of this.projectile_list){
            
            //Update and draw projectiles
            projectile.update_position(t);
            projectile.draw(context,program_state);

            //Remove projectiles that have existed too long
            let delta_t = t - projectile.creation_time;
            if(delta_t >= this.projectile_life_time){ 
                let index = this.projectile_list.indexOf(projectile);
                this.projectile_list.splice(index, 1);
            }
        }
        
        //Create birds
        if(Math.random() > 0.997 || !this.initial_bird_made)
        {
            if(this.bird_list.length < 5){//TODO remove this, this is only for testing to not let scene get too crazy
                
                this.initial_bird_made = true; //Used for debugging, feel free to comment out
                let dir = Math.random() < 0.5 ? -1:1;
                let pos = model_transform.times(Mat4.translation(-10 * dir,Math.random() * 20 - 10,Math.random()*30)).times(Mat4.rotation(dir * Math.PI/2,0,1,0));
                let new_bird = new Bird(pos,t,dir);
                this.bird_list.push(new_bird);
            }
        }

        //Update and Draw Birds
        for(let bird of this.bird_list){ 
            let returned_arr = bird.draw(context, program_state, t, this.shapes, this.materials);
            let bk = returned_arr[0];
            let bod = returned_arr[1];
            let lw = returned_arr[2];
            let rw = returned_arr[3];
            bird.set_vectors(bk,bod,lw,rw); //Used for collision detection
        }

        //Check for collisions and if birds leave the area
        for(let bird of this.bird_list){
            for(let projectile of this.projectile_list){
                if(bird.does_collide(projectile)){
                    //TODO Add game logic here, player hit a bird!
                    let index = this.bird_list.indexOf(bird); //Remove bird
                    this.bird_list.splice(index, 1);
                }
            }

            //TODO add funcitonality  to remove birds after they leave range, and reduce the user' life
            //Can see how I remove projectiles
        }    


    }

}
