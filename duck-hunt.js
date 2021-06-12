import {defs, tiny} from './examples/common.js';
import {Shape_From_File, Blade, Tree, Bird, Projectile,Texture_Scroll_X, Text_Line } from './base-files.js'
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
        this.frame_count = 0;

        //Gun Relevant Vars
        this.endPoint = vec3(0,0,0);
        this.startPoint = vec3(0,0,0);

        //Bird Relevant Vars
        this.bird_list = [];
        this.initial_bird_made = false; //Used for debugging by Ian. Always makes sure a bird spawns right away

        //Projectile Relevant Vars
        this.projectile_list = [];
        this.shoot = false; //If in this frame user requests to shoot
        this.last_shot_t = null;
        this.projectile_refresh_time = 1.5; //How many seconds until we can shoot a new projectile
        this.projectile_life_time = 1.8; //How many seconds a projectile can live for, 

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
            gun: new Shape_From_File("assets/guns.obj"),
            rock: new Shape_From_File("assets/rock.obj"),
            bullet: new Shape_From_File("assets/bullet.obj"),
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
            text: new Text_Line(35),
            'grass': new Shape_From_File("assets/grass-simplified.obj")
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, specularity: 0.5,color: hex_color("#ffffff")}),
            texture2: new Material(new Texture_Scroll_X(), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/clouds2.png","LINEAR_MIPMAP_LINEAR")
            }),
            gunMaterial: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, specularity: 0.5,color: hex_color("#616160")}),
            gunner: new Material(new defs.Textured_Phong(), {
                ambient: 1,
                diffusivity: 1,
                specularity: 0.5,
                color: color(0.0,0.0,0,1),
                texture: new Texture("assets/gun.png")
            }),
            rockMaterial: new Material(new defs.Phong_Shader(), {
                ambient: 0.2,
                diffusivity: 0.2,
                specularity: 0.2,
                color: hex_color("#5e5644")
            }),
            grass: new Material(new defs.Phong_Shader(), {
                ambient: 0.4,
                diffusivity: 0.2,
                specularity: 0.2,
                color: hex_color("#1C9E32")
            }),
            ground: new Material(new defs.Fake_Bump_Map(), {
                ambient: 0.2,
                diffusivity: 1,
                specularity: 1,
                color: color(0.0,0.0,0,1),
                //color: hex_color("#315420"),
                texture: new Texture("assets/grass.jpeg","LINEAR_MIPMAP_LINEAR")
            }),
            leaf: new Material(new defs.Textured_Phong(), {
                ambient: 0.8,
                diffusivity: 1,
                specularity: 0.0,
                color: color(0.0,0.0,0,1),
                texture: new Texture("assets/leaf.png","LINEAR_MIPMAP_LINEAR")
            }),
            text_image:  new Material(new defs.Static_Phong(1), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }),
            text_image2:  new Material(new defs.Static_Phong2(1), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }),
            board: new Material(new defs.Board_Phong(), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/scoreBoard.png","LINEAR_MIPMAP_LINEAR")
            }),
            endImage: new Material(new defs.endScreen(), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/endScreen.png","LINEAR_MIPMAP_LINEAR")
            }),
            back: new Material(new defs.Back_Shader(), {
                color: color(0.0,0.0,0,1),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
            }),
            test: new Material(new defs.Phong_Shader(),
                {ambient: 0.8, diffusivity: .1, specularity: 1, color: hex_color("#bababa")}),
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
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 50), vec3(0, 0, 0), vec3(0, 1, 0));
        // The white material and basic shader are used for drawing the outline.
        //this.white = new Material(new defs.Basic_Shader());
    }

    make_blades_of_grass() {
        this.blades = [];

        let gridsize_x = 0.45;
        let gridsize_z = 0.8;

        let origin_x = 0.0;
        let origin_z = 32.4;

        let period = 10;
        let angle_amplitude = (1 / 30) * Math.PI;

        let unique_rot_cuttof = 10; //Number of unique rotations we will have, after this we will start using 'copy_blades'
        let non_copy_blades = [];
        for (let i = -45; i < 45; i++) { //x cord
            for (let j = -3; j < 2; j++) { //z cord
                if(this.blades.length <= unique_rot_cuttof){
                    let new_blade = new Blade(origin_x,origin_z,i, j, gridsize_x, gridsize_z, angle_amplitude, period,null);
                    this.blades.push(new_blade);
                    non_copy_blades.push(new_blade)
                }
                else{
                    let random_blade = non_copy_blades[Math.floor(Math.random() * non_copy_blades.length)];
                    let new_blade = new Blade(origin_x,origin_z,i, j, gridsize_x, gridsize_z, angle_amplitude, period,random_blade);
                    this.blades.push(new_blade);
                }
            }
        }
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            //this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            //program_state.set_camera(Mat4.translation(5, -20, -60));
            //program_state.set_camera(Mat4.translation(0.33, -4, -10));
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 30, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 3000)];
    }
}

export class Duck_Hunt extends Base_Scene {
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
        this.camera_location = Mat4.translation(0.33, -4, -10);
        this.birdsHit = 0;
        this.bulletsLeft = 10;
        this.lose = false;
        this.check = true;
        this.refresh = false;
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Shoot", ["c"], () => { this.shoot = true; });  
        this.key_triggered_button("Restart", ["r"], () => { this.refresh = true; });  
    }

    drawLeaves(context, program_state,leafColor,tree,location){
        for(let k = 0; k < 3; k++){
            let model_transform =location;
            let x = tree.branchPos[k][0];
            let y = tree.branchPos[k][1];
            let z = tree.branchPos[k][2];
            model_transform = model_transform.times(Mat4.translation(x,y,z)).times(Mat4.scale(3,2,3));
            this.shapes.ball.draw(context, program_state, model_transform, this.materials.leaf);
        }
    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        const red = hex_color("#ff0000");
        const green = hex_color("#2c3b26");
        const brown = color(0.3,0.24, 0.08, 1)
        let model_transform = Mat4.identity();
        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        this.frame_count++;

        if(this.lose){
            this.shapes.square.draw(context, program_state, model_transform, this.materials.endImage);
        }
        if(this.refresh){
            this.lose = false; 
            this.birdsHit = 0;
            this.bulletsLeft = 10;
            this.refresh = false;
            this.bird_list = [];
        }

          

        //TODO: Draw Score
        //---------------
        let score_transform = model_transform.times(Mat4.translation(50,10,20)).times(Mat4.scale(0.15,0.15,1)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        let num = this.birdsHit
        let birdsHitString = "Birds Hit:" + num.toString()
        this.shapes.text.set_string(birdsHitString, context.context);
        this.shapes.text.draw(context, program_state, score_transform, this.materials.text_image);

        let num2 = this.bulletsLeft
        let bulletsLeftString = "Bullets Left:" + num2.toString()
        this.shapes.text.set_string(bulletsLeftString, context.context);
        this.shapes.text.draw(context, program_state, score_transform, this.materials.text_image2);
        
        //this.shapes.square.draw(context, program_state, score_transform, this.materials.back);
        //Draw Gun
        //---------
        let n = context.context.mousePos;
        let x = n[0]/20;
        let y = n[1]/20;
        //console.log(y)
        if(y>15){
            y = 15;
        }
        if(y<0){
            y = 0;
        }
        let angle1 = Math.atan2(x,40);
        let angle2 = Math.atan2(y,40);
        let camera = Mat4.look_at(vec3(0, 10, 50), vec3(x, y, 0), vec3(0, 1, 0));  
        program_state.set_camera(camera); 
        
        let weapon = model_transform.times(Mat4.translation(x/10,5+y/5,40)); 
        weapon = weapon.times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI-2*angle1,0,0,1)).times(Mat4.rotation(-2*angle2,1,0,0));
        weapon = weapon.times(Mat4.scale(1,1,1));

        this.shapes.gun.draw(context, program_state, weapon, this.materials.gunMaterial)

        //Draw Skybox, Trees, and Ground
        //-----------------------------
        let sky_transform = model_transform.times(Mat4.translation(0,25,10)).times(Mat4.scale(90,110,50)).times(Mat4.rotation(0.5 * Math.PI, 1, 0, 0));
        let cloud_transform = model_transform.times(Mat4.translation(0,40,12)).times(Mat4.scale(90,50,50)).times(Mat4.rotation(0.5 * Math.PI, 1, 0, 0));

        this.shapes.cylinder.draw(context, program_state, sky_transform, this.materials.plastic.override({color:blue}));
        this.shapes.cylinder.draw(context, program_state, cloud_transform, this.materials.texture2);

        let ground_transform = model_transform.times(Mat4.translation(0,-5,20)).times(Mat4.scale(50,1,30)).times(Mat4.rotation(0.5 * Math.PI, 1, 0, 0));
        this.shapes.square.draw(context, program_state, ground_transform, this.materials.ground);

        let top_transform = model_transform.times(Mat4.translation(0,50,20)).times(Mat4.scale(50,1,80)).times(Mat4.rotation(0.5 * Math.PI, 1, 0, 0));
        //this.shapes.square.draw(context, program_state, top_transform, this.materials.plastic.override({color:blue}));
/*
        let tree_transform = model_transform.times(Mat4.translation(-14,0,20)).times(Mat4.scale(0.5,0.8,0.5)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.tree1.draw(context, program_state, tree_transform, this.materials.plastic.override({color:brown}));
        this.drawLeaves(context,program_state,green,this.shapes.tree1,tree_transform)

        let tree_transform2 = model_transform.times(Mat4.translation(0,0,25)).times(Mat4.scale(0.5,0.6,0.5)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.tree2.draw(context, program_state, tree_transform2, this.materials.plastic.override({color:brown}));
        this.drawLeaves(context,program_state,green,this.shapes.tree2,tree_transform2)

        let tree_transform3 = model_transform.times(Mat4.translation(15,0,23)).times(Mat4.scale(0.5,0.7,0.5)).times(Mat4.rotation(0.0 * Math.PI, 1, 0, 0));
        this.shapes.tree3.draw(context, program_state, tree_transform3, this.materials.plastic.override({color:brown}));
        this.drawLeaves(context,program_state,green,this.shapes.tree3,tree_transform3)
        */
        let rockTransform1 = Mat4.translation(33,0,20).times(Mat4.scale(6,8,6));
        this.shapes.rock.draw(context, program_state, rockTransform1, this.materials.rockMaterial);
        let rockTransform2 = Mat4.translation(-33,0,20).times(Mat4.scale(5,7,5));
        this.shapes.rock.draw(context, program_state, rockTransform2, this.materials.rockMaterial);

        let trees = [this.shapes.tree1,this.shapes.tree2,this.shapes.tree3,this.shapes.tree4,this.shapes.tree5,
            this.shapes.tree6,this.shapes.tree7,this.shapes.tree8,this.shapes.tree9,this.shapes.tree10];
        
        let xCoord = -25;
        let zStart = 15;
        let zCoord = 15;
        let numAcross = 4;
        let numForward = 8;
        let varAcross = 7;
        let yScale = 0.8;
        let yScaleStart = 0.8;

        for(let i = 0; i < numForward; i++){
            let model_transform = Mat4.identity();
            zCoord  = zStart + (10*(i%2))
            if(i >= 7){
                zCoord = zStart;
                xCoord += 5;
            }
            yScale = yScaleStart - (0.2*(i%2))
            model_transform = model_transform.times(Mat4.translation(xCoord,0,zCoord)).times(Mat4.scale(0.5,yScale,0.5));
            trees[i].draw(context, program_state, model_transform, this.materials.plastic.override({color:brown}));
            this.drawLeaves(context,program_state,green,trees[i],model_transform);
            xCoord += varAcross;
        }

        //Handle Camera Pointing
        //--------------------
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

        //Shoot Projectile
        //----------------
        if(this.shoot){   //User tried to shoot
            this.shoot = false;

            if(this.last_shot_t == null || t - this.last_shot_t > this.projectile_refresh_time && this.bulletsLeft > 0){ //User is allowed to shoot
                this.last_shot_t = t;
                this.bulletsLeft -= 1;

                let end_point = vec3(x + Math.sin(angle1) * 220,y + Math.sin(angle2) * 245 - 20,-50);
                let start_point = vec3(x - Math.sin(angle1) * 25,y - Math.sin(angle2) * 25,50);
                
                let new_projectile = new Projectile(start_point,end_point,t,this.shapes.sphere,0.5,this.materials.test);
                this.projectile_list.push(new_projectile);
            }
        }

        //Update and Draw Projectiles
        //---------------------------
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

        //Create Birds
        //-------------
        if(Math.random() > 0.997 || !this.initial_bird_made)
        {
            if(this.bird_list.length < 7){//TODO remove this, this is only for testing to not let scene get too crazy
                
                this.initial_bird_made = true; //Used for debugging, feel free to comment out
                let dir = Math.random() < 0.5 ? -1:1;
                let pos = model_transform.times(Mat4.translation(-80 * dir,Math.random() * 10+5,Math.random()*-20)).times(Mat4.rotation(dir * Math.PI/2,0,1,0));
                let new_bird = new Bird(pos,t,dir);
                this.bird_list.push(new_bird);
            }
        }

        //Update and Draw Birds
        //---------------------
        for(let bird of this.bird_list){ 
            let returned_arr = bird.draw(context, program_state, t, this.shapes, this.materials);
            let bk = returned_arr[0];
            let bod = returned_arr[1];
            let lw = returned_arr[2];
            let rw = returned_arr[3];
            bird.set_vectors(bk,bod,lw,rw); //Used for collision detection
        }

        //Collisions and Bird Despawn
        //-----------------------------
        for(let bird of this.bird_list){
            for(let projectile of this.projectile_list){
                if(bird.does_collide(projectile)){
                    //TODO Add game logic here, player hit a bird!
                    let index = this.bird_list.indexOf(bird); //Remove bird
                    this.bird_list.splice(index, 1);
                    this.birdsHit += 1;
                    this.bulletsLeft += 2;
                }
            }

            //TODO add funcitonality  to remove birds after they leave range, and reduce the user' life
            let origin = vec4(0,0,0,1);
            let pos = bird.position.times(origin);
            //Check if pos is not in proper range
            if(pos[0] * bird.direction > 68){
                //Remove bird from the list:
                let index = this.bird_list.indexOf(bird); //Remove bird
                this.bird_list.splice(index, 1);
            }
            
        }    

        //Lose condition, no bullets left and no bullets in the air
        if(this.bulletsLeft == 0 && this.projectile_list.length == 0){
            this.lose = true;
        }

        //Draw Grass
        //----------
        for (let blade of this.blades) {
            
            if(!blade.should_update(this.frame_count)){ //Case where we used cached transform
                this.shapes.grass.draw(context, program_state, blade.cached_transform_mat4, this.materials.grass.override({color: blade.color}));
                continue;
            }

            if(blade.copy_blade == null){ //If our blade is not a 'copy_blade'
                //Scale
                if(blade.cached_scale_mat4 == null){ //Check if we do not have it cached
                    blade.cached_scale_mat4 = Mat4.scale(blade.width_scale, blade.height_scale,1).times(to_origin);
                }

                //Rotate
                let angle = blade.get_angle(t);
                let rotation = Mat4.rotation(angle, 0, 0, 1).times(blade.cached_scale_mat4);
                blade.cached_rotation_mat4 = rotation; //Cache this for 'copy_blades' to use

                //Translate
                let position = blade.get_position();
                let translate = Mat4.translation(position[0],position[1],position[2]).times(rotation);
                blade.cached_transform_mat4 = translate; //Cache the result
                
                this.shapes.grass.draw(context, program_state, translate, this.materials.grass.override({color: blade.color}));
            }
            else{ //If our blade is a 'copy_blade'
                let rotation = blade.copy_blade.cached_rotation_mat4;
                let position = blade.get_position();
                let translate = Mat4.translation(position[0],position[1],position[2]).times(rotation);
                blade.cached_transform_mat4 = translate; //Cache the result
                
                this.shapes.grass.draw(context, program_state, translate, this.materials.grass.override({color: blade.color}));
            }

        }
        //Scoreboard part 2 

        this.shapes.square.draw(context, program_state, score_transform, this.materials.board);
    }
}




