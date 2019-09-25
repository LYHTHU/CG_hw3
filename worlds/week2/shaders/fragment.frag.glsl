#version 300 es// NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform float uTime; // TIME,  IN SECONDS
in vec3 vPos; // POSITION IN IMAGE
out vec4 fragColor; // RESULT WILL GO HERE

const int NS = 3; // Number of uShapes in the scene
const int NL = 2; // Number of light sources in the scene
const float eps = 1.e-7; 
const vec3 eye = vec3(0., 0., 5.); 
const vec3 screen_center = vec3(0., 0., 2.5); 

struct Shape{
    int type;
    vec3 center;
    float r;

    int n_p;
    vec4 plane[10];
};


struct Material{
    vec3 ambient; 
    vec3 diffuse; 
    vec3 specular; 
    float power;
}; 

struct Ray{
    vec3 src; 
    vec3 dir; 
}; 

struct Light{
    vec3 rgb; 
    vec3 src; 
}; 

Shape uShapes[NS];
Material uMaterials[NS];
Light lights[NL];


Ray get_ray(vec3 p_src, vec3 p_dest){
    Ray ret; 
    ret.src = p_src; 
    ret.dir = normalize(p_dest - p_src); 
    return ret; 
}

// Setting the parameters of uShapes and lights
void init(){
    // x,  y:  - 2 ~ 2,  z: 0~4
    // state.uMaterialsLoc=[];
    // state.uMaterialsLoc[0]={};
    // state.uMaterialsLoc[0].diffuse=gl.getUniformLocation(program,'uMaterials[0].diffuse');
    // state.uMaterialsLoc[0].ambient=gl.getUniformLocation(program,'uMaterials[0].ambient');
    // state.uMaterialsLoc[0].specular=gl.getUniformLocation(program,'uMaterials[0].specular');
    // state.uMaterialsLoc[0].power=gl.getUniformLocation(program,'uMaterials[0].power');
    // gl.uniform3fv(state.uMaterialsLoc[0].ambient,[.05, 0, 0]);
    // gl.uniform3fv(state.uMaterialsLoc[0].diffuse,[.5, 0, 0]);
    // gl.uniform3fv(state.uMaterialsLoc[0].specular,[.5, .5, .5]);
    // gl.uniform1f(state.uMaterialsLoc[0].power, 20);

    uShapes[0].center = vec3(1., 0., -1.); 
    uShapes[0].r = .6; 
    uShapes[0].type=0;

    uShapes[1].center = vec3( -.5, 1.2, -.4); 
    uShapes[1].r = .7;
    uShapes[2].type=0;
 

    // uShapes[2].center=vec3(-.5,-1.2,-.3);
    uShapes[2].center=vec3(0., 0., 0.);
    uShapes[2].r=0.05;
    uShapes[2].n_p = 8;
    uShapes[2].type = 1;

    float r3 = 1./sqrt(3.);

    float r = uShapes[2].r;

    mat4 inv_A = mat4(1.0);
    inv_A[0][3] = -uShapes[2].center[0];
    inv_A[1][3] = -uShapes[2].center[1];
    inv_A[2][3] = -uShapes[2].center[2];

    uShapes[2].plane[0] = vec4(-r3,-r3,-r3,-r);
    uShapes[2].plane[1] = vec4(-r3,-r3,+r3,-r);
    uShapes[2].plane[2] = vec4(-r3,+r3,-r3,-r);
    uShapes[2].plane[3] = vec4(-r3,+r3,+r3,-r);
    uShapes[2].plane[4] = vec4(+r3,-r3,-r3,-r);
    uShapes[2].plane[5] = vec4(+r3,-r3,+r3,-r);
    uShapes[2].plane[6] = vec4(+r3,+r3,-r3,-r);
    uShapes[2].plane[7] = vec4(+r3,+r3,+r3,-r);



    // state.uMaterialsLoc[1]={};
    // gl.uniform3fv(state.uMaterialsLoc[1].ambient,[.1,.1,0.]);
    // gl.uniform3fv(state.uMaterialsLoc[1].diffuse,[.5,.5,0.]);
    // gl.uniform3fv(state.uMaterialsLoc[1].specular,[1.,1.,1.]);
    // gl.uniform1f(state.uMaterialsLoc[1].power, 20);

    uMaterials[0].ambient=vec3(0.,.1,.1);
    uMaterials[0].diffuse=vec3(0.,.5,.5);
    uMaterials[0].specular=vec3(0.,1.,1.);// 4th value is specular power
    uMaterials[0].power = 10.;

    uMaterials[1].ambient=vec3(.1,.1,0.);
    uMaterials[1].diffuse=vec3(.5,.5,0.);
    uMaterials[1].specular=vec3(1.,1.,1.);
    uMaterials[1].power=20.;

    uMaterials[2].ambient=vec3(.1,.1,0.);
    uMaterials[2].diffuse=vec3(.4,.1,0.3);
    uMaterials[2].specular=vec3(1.,1.,1.);
    uMaterials[2].power=20.;

    
    lights[0].rgb = vec3(1., 1., 1.); 
    lights[0].src = vec3(1.*sin(uTime), 2.*cos(uTime), -.5); 
    lights[1].rgb = vec3(1., 1., 1.); 
    lights[1].src = vec3(-1.*cos(uTime), 0., 1.*sin(uTime)); 
}

vec3 get_normal(Shape s, vec3 pos){
    switch(s.type) {
        case 0: 
        // Sphere
            return normalize(pos-s.center);
            break;
        case 1:
        // Octahedron
            return sign(pos - s.center);
        default:
            return normalize(pos-s.center);
            break;
    }

}

vec2 intersect(Ray r,  Shape s){
    switch(s.type)
    {
        case 0: 
        // Sphere
            float t; 
            // d  =  direction of ray,  s  =  source of ray,  c  =  center of shape
            vec3 c_s = s.center - r.src; 
            float dc_s = dot(r.dir, c_s); 
            float d2 = dot(r.dir, r.dir); // should be 1
            float r2 = s.r*s.r; 
            float delta = pow(dc_s, 2.) - d2*(dot(c_s, c_s) - r2); 
            if(delta < 0.){
                // no intersect
                return vec2(-1., -2.); 
            }
            else if(delta > eps){
                // two intersect
                float t1 = (dc_s - sqrt(delta))/d2; 
                float t2 = (dc_s + sqrt(delta))/d2; 
                return vec2(t1,t2);
            }
            else{
                // one intersect
                t = dc_s/d2; 
                return vec2(t, t); 
            }
            break;
        case 1:
        // Polyhedron
            // find the biggest t, when P*v > 0 at the begining
            float t_min = -10000., t_max = 10000.0;
            float p_src = 0., p_dir = 0.;
            for (int i = 0; i < s.n_p; i++) {
                p_dir = dot(vec4(r.dir, 1.), s.plane[i]);
                p_src = dot(vec4(r.src, 1.), s.plane[i]);
                if (p_dir != 0.) {
                    if(p_src >= 0.) {
                        t = -p_src / p_dir;
                        if (t > t_min) {
                            t_min = t;
                        }
                    }
                    else {
                        // < 0
                        t=-p_src / p_dir;
                        if(t < t_max){
                            t_max = t;
                        }
                    }
                }
            }
            return vec2(t_min, t_max);
    }
}

bool inside(vec3 point, Shape s) {
    switch (s.type) {
        case 0:
            return length(point - s.center) < s.r;
        case 1:
        for (int i = 0; i < s.n_p; i++) {
            if (dot(s.plane[i], vec4(point, 1)) > 0.) {
                return false;
            }
        }
        return true;
    }
}

bool hidden_by_shape(Light l){
    Ray ray = get_ray(eye, l.src); 
    for(int i = 0; i < NS; i++){
        if(inside(l.src, uShapes[i])){
            return true; 
        }
        
        vec2 t = intersect(ray, uShapes[i]); 
        if(t[1] > t[0] && t[0] > 0. && t[0] < length(l.src - eye)){
            return true; 
        }
        
    }
    return false; 
}

Ray reflect_ray(Ray rin, vec3 norm){
    Ray ret; 
    ret.src = rin.src; 
    ret.dir = normalize(2.*dot(norm, rin.dir)*norm - rin.dir); 
    return ret; 
}

bool is_in_shadow(vec3 pos, vec3 norm, Light light){
    
    pos = pos + .0001*norm; 
    bool ret = false; 
    Ray ray_l = get_ray(pos, light.src); 
    for(int j = 0; j < NS; j++){
        vec2 t = intersect(ray_l,uShapes[j]);
        if(t[1] > t[0] && t[0] > 0.){
            return true; 
        }
    }
    return ret; 
}

// inter_point: the intersect point 
// index: index of shape
vec3 phong(vec3 inter_point, int index) {
    vec3 N=get_normal(uShapes[index],inter_point);
    vec3 color=uMaterials[index].ambient;
    for(int j=0;j<NL;j++){
        if(!is_in_shadow(inter_point,N,lights[j])){
            Ray L = get_ray(inter_point,lights[j].src);
            Ray E = get_ray(inter_point,eye);
            Ray R = reflect_ray(L,N);
            color += lights[j].rgb*(uMaterials[index].diffuse*max(0.,dot(N,L.dir)));
            // That is where the bug is.
            // Something in Pow. If specular  >  =  10.,  it will overflow.
            // float s  =  max(0.,  pow(dot(E.dir,  R.dir),  uShapes[index].specular[3]) );
            float s;
            float er = dot(E.dir,R.dir);
            if(er > 0.){
                s = max(0.,exp(uMaterials[index].power*log(er)));
            }
            else{
                s = 0.;
            }
            color += lights[j].rgb*uMaterials[index].specular*s;
        }
    }
    return color;
}

vec3 ray_tracing(){
    vec3 color = vec3(0., 0., 0.); 
    Ray ray = get_ray(eye, screen_center + vec3(vPos.xy, 0)); 
    for(int i = 0; i < NL; i++){
        // show lights
        if(dot(normalize(lights[i].src - ray.src), ray.dir) > .99999){
            if(hidden_by_shape(lights[i]))continue; 
            color = lights[i].rgb; 
            return color; 
        }
    }
    
    float t_min = 10000.; 
    int index =  - 1; 
    
    for(int i = 0; i < NS; i++){
        vec2 t = intersect(ray, uShapes[i]); 

        if (t[1] >= t[0]) {
            if(t[0] >= 0.){

                if(t[0] < t_min){
                    t_min=t[0];
                    index=i;
                }
            }
            else {
                if(t[1] < t_min){
                    t_min = t[1];
                    index = i;
                }
            }
        }
    }

    if(index >  - 1){
        vec3 inter_point = ray.src + t_min*ray.dir; 
        color = phong(inter_point, index);
    }
    
    return color; 
}

void main(){
    init(); 
    vec3 color = ray_tracing(); 
    fragColor = vec4(color, 1.); 
}
