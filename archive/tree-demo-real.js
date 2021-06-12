import {defs, tiny} from './examples/common.js';
import {Shape_From_File, Blade, Tree, Bird, Projectile, } from './baseFiles.js'
const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Cylindrical_Tube, Grid_Patch, Textured_Phong, Static_Phong} = defs; 

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        //this.hover = this.swarm = false;

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

        this.hover = this.swarm = false;
        this.frame_count = 0;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.

        //this.scl = 0.7
        this.shapes = {
            'cube': new Cube(),
            'cylinder': new Cylindrical_Tube(1, 10, [[0, 2], [0, 1]]),
            'square': new defs.Square(),
            'ball': new defs.Subdivision_Sphere(2),
            sphere: new defs.Subdivision_Sphere(4),
            eyes: new Shape_From_File("assets/eyes.obj"),
            body: new Shape_From_File("assets/body.obj"),
            beak: new Shape_From_File("assets/beak.obj"),
            neck: new Shape_From_File("assets/neck.obj"),
            wing: new Shape_From_File("assets/wing.obj"),
            head: new Shape_From_File("assets/head.obj"),
            'tree1': new Tree(),
            'tree2': new Tree(),
            'tree3': new Tree(),
            'tree4': new Tree(),
            'tree5': new Tree(),
            'tree6': new Tree(),
            'tree7': new Tree(),
            'tree8': new Tree(),
            'tree9': new Tree(),
            'tree10': new Tree(),
            'grass': new Shape_From_File("assets/grass-simplified.obj")
        };
        this.shader = new defs.Basic_Shader();
        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            texture2: new Material(new Texture_Scroll_X(), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/clouds2.png","LINEAR_MIPMAP_LINEAR")
            }),
            grass: new Material(new defs.Phong_Shader(), {
                ambient: 0.2,
                diffusivity: 0.2,
                specularity: 0.2,
                color: hex_color("#1C9E32")
            }),
            ground: new Material(new defs.Phong_Shader(), {
                ambient: 0.6,
                diffusivity: 1,
                specularity: 1,
                color: hex_color("#5E552A")
            }),
            board: new Material(new defs.Basic_Shader(), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                //texture: new Texture("assets/stars.png","LINEAR_MIPMAP_LINEAR")
            }),
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
        };
        this.make_blades_of_grass();
        // The white material and basic shader are used for drawing the outline.
        //this.white = new Material(new defs.Basic_Shader());
    }

    make_blades_of_grass() {
        this.blades = [];

        let gridsize = 0.45;
        let period = 10;
        let angle_amplitude = (1 / 30) * Math.PI;

        for (let i = -15; i < 15; i++) { //x cord
            for (let j = -4; j < 1; j++) { //z cord
                var new_blade = new Blade(i, j, gridsize, angle_amplitude, period);
                this.blades.push(new_blade)
            }
        }
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            //program_state.set_camera(Mat4.translation(5, -20, -60));
            program_state.set_camera(Mat4.translation(0.33, -4, -10));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

export class Tree_Demo extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */
    constructor(){
    	super();
        this.lookR = false;
        this.lookL = false;
        this.camera_location = Mat4.translation(0.33, -4, -10)
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Look Right", ["l"], () => {
            this.lookR = true;
        });
        this.key_triggered_button("Look Left", ["j"], () => {
            this.lookL = true;
        });
        this.new_line();
        this.key_triggered_button("Shoot", ["c"], () => { this.shoot = true; });  
    }

    drawLeaves(context, program_state,leafColor,tree,location){
        for(let k = 0; k < 3; k++){
            let model_transform =location;
            let x = tree.branchPos[k][0];
            let y = tree.branchPos[k][1];
            let z = tree.branchPos[k][2];
            model_transform = model_transform.times(Mat4.translation(x,y,z)).times(Mat4.scale(3,2,3));
            this.shapes.ball.draw(context, program_state, model_transform, this.materials.plastic.override({color:leafColor}));
        }
    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        const red = hex_color("#ff0000");
        const green = hex_color("#00ff00");
        const brown = color(0.3,0.24, 0.08, 1)
        let model_transform = Mat4.identity();
        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        this.frame_count++;

        let model_transform1 = model_transform.times(Mat4.translation(0,50,-10)).times(Mat4.scale(50,50,90)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        let sky_transform = model_transform.times(Mat4.translation(0,10,-70)).times(Mat4.scale(70,30,1)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        let model_transform3 = model_transform.times(Mat4.translation(0,13,-5)).times(Mat4.scale(15,10,15)).times(Mat4.rotation(0.5 * Math.PI, 1, 0, 0));

        //this.shapes.cube.draw(context, program_state, model_transform1, this.materials.plastic.override({color:blue}));
        this.shapes.square.draw(context, program_state, sky_transform, this.materials.plastic.override({color:blue}));
        this.shapes.cylinder.draw(context, program_state, model_transform3, this.materials.texture2);
        //model_transform = model_transform.times(Mat4.translation(-25,0,-25));

        let square_transform = model_transform.times(Mat4.translation(0,0,0)).times(Mat4.scale(20,1,20)).times(Mat4.rotation(0.5 * Math.PI, 1, 0, 0));
        this.shapes.square.draw(context, program_state, square_transform, this.materials.ground);

        let tree_transform = model_transform.times(Mat4.translation(-10,0,-10)).times(Mat4.scale(0.5,0.5,0.5)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.tree1.draw(context, program_state, tree_transform, this.materials.plastic.override({color:brown}));
        this.drawLeaves(context,program_state,green,this.shapes.tree1,tree_transform)

        let tree_transform2 = model_transform.times(Mat4.translation(0,0,-10)).times(Mat4.scale(0.5,0.5,0.5)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.tree2.draw(context, program_state, tree_transform2, this.materials.plastic.override({color:brown}));
        this.drawLeaves(context,program_state,green,this.shapes.tree2,tree_transform2)

        let tree_transform3 = model_transform.times(Mat4.translation(7,0,-10)).times(Mat4.scale(0.5,0.5,0.5)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.tree3.draw(context, program_state, tree_transform3, this.materials.plastic.override({color:brown}));
        this.drawLeaves(context,program_state,green,this.shapes.tree3,tree_transform3)
        
        let score_transform = this.camera_location.times(Mat4.translation(0,0,0)).times(Mat4.scale(0.15,0.15,1)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.square.draw(context, program_state, score_transform, new Material(this.shader));

        let to_origin = Mat4.translation(0, 1.4, 0).times(model_transform);

        if(this.lookR){
            this.camera_location = this.camera_location.times(Mat4.rotation(0.125 * Math.PI, 0, 1, 0));
            program_state.set_camera(this.camera_location);
            this.lookR = false;
        }
        if(this.lookL){
            this.camera_location = this.camera_location.times(Mat4.rotation(-0.125 * Math.PI, 0, 1, 0));
            program_state.set_camera(this.camera_location);
            this.lookL = false;
        }
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
                let pos = model_transform.times(Mat4.translation(-10 * dir,Math.random() * 10+5,Math.random()*-20)).times(Mat4.rotation(dir * Math.PI/2,0,1,0));
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

        let count = this.blades.length
        let count2 = 0

        for (let i = 0; i < count2; i++) {

            let blade = this.blades[i];
            
            if(!blade.should_update(this.frame_count)){ //Case where we used cached transform
                this.shapes.grass.draw(context, program_state, blade.cached_transform_mat4, this.materials.grass.override({color: blade.color}));
                continue;
            }

            //Scale
            if(blade.cached_scale_mat4 == null){ //Check if we do not have it cached
                blade.cached_scale_mat4 = Mat4.scale(blade.width_scale, blade.height_scale,1).times(to_origin);
            }

            //Rotate
            let angle = blade.get_angle(t);
            let rotation = Mat4.rotation(angle, 0, 0, 1).times(blade.cached_scale_mat4);

            //Translate
            let position = blade.get_position();
            let translate = Mat4.translation(position[0],position[1],position[2]).times(rotation);
            blade.cached_transform_mat4 = translate; //Cache the result
            
            this.shapes.grass.draw(context, program_state, translate, this.materials.grass.override({color: blade.color}));
        }

        let trees = [this.shapes.tree1,this.shapes.tree2,this.shapes.tree3,this.shapes.tree4,this.shapes.tree5,
                     this.shapes.tree6,this.shapes.tree7,this.shapes.tree8,this.shapes.tree9,this.shapes.tree10];

        for(let i = 0; i < 0; i++){
        	for(let j = 0; j < 3; j++){
                let num = Math.floor(Math.random() * 10); 
                let model_transform = Mat4.identity();
                model_transform = model_transform.times(Mat4.translation(j*15,0,i*20));
                trees[j+i].draw(context, program_state, model_transform, this.materials.plastic.override({color:brown}));
                for(let k = 0; k < 3; k++){
                    let model_transform = Mat4.identity();
                    let x = trees[j+i].branchPos[k][0];
                    let y = trees[j+i].branchPos[k][1];
                    let z = trees[j+i].branchPos[k][2];
                    model_transform = model_transform.times(Mat4.translation(j*15,0,i*20)).times(Mat4.translation(x,y,z)).times(Mat4.scale(3,2,3));
                    this.shapes.ball.draw(context, program_state, model_transform, this.materials.plastic.override({color:green}));
                }
            }
        }
    }
}

class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                float offset = 0.02*animation_time;

                vec4 tex_color = texture2D( texture, vec2(f_tex_coord.x-offset,f_tex_coord.y));
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


