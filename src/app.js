///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    /**
        Primary entry point to NanoGL. An app will store all parts of the WebGL
        state and manage draw calls.

        @class
        @param {DOMElement} canvas The canvas on which to create the WebGL context.
        @param {Object} [contextAttributes] Context attributes to pass when calling getContext().
        @prop {DOMElement} canvas The canvas on which this app drawing.
        @prop {WebGLRenderingContext} gl The WebGL context.
        @prop {number} width The width of the drawing surface.
        @prop {number} height The height of the drawing surface.
        @prop {number} maxDrawBuffers The maximum number of available draw buffers.
        @prop {boolean} drawBuffersEnabled Whether the WEBGL_draw_buffers extension is enabled.
        @prop {boolean} depthTexturesEnabled Whether the WEBGL_depth_texture extension is enabled.
        @prop {boolean} floatTexturesEnabled Whether the OES_texture_float extension is enabled.
        @prop {boolean} linearFloatTexturesEnabled Whether the OES_texture_float_linear extension is enabled.
        @prop {Object} currentState Tracked GL state.
        @prop {GLEnum} clearBits Current clear mask to use with clear().
        @prop {WebGLDrawBuffers} drawBuffersExtension Hold the draw buffers extension object when enabled.
    */
    NanoGL.App = function App(canvas, contextAttributes) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl", contextAttributes) || canvas.getContext("experimental-webgl", contextAttributes);
        this.width = this.gl.drawingBufferWidth;
        this.height = this.gl.drawingBufferHeight;
        this.currentDrawCalls = null;

        this.currentState = {
            program: null
        };

        this.clearBits = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT;
        
        this.gl.viewport(0, 0, this.width, this.height);    
        
        this.drawBuffersExtension = null;
        
        this.maxDrawBuffers = 1;
        this.drawBuffersEnabled = false;
        this.depthTexturesEnabled = false;
        this.floatTexturesEnabled = false;
        this.linearFloatTexturesEnabled = false;

        this.debugEnabled = false;
    };

    /**
        Set the clear mask bits to use when calling clear().
        E.g. app.clearMask(NanoGL.COLOR_BUFFER_BIT).

        @method
        @param {GLEnum} mask Bit mask of buffers to clear.
    */
    NanoGL.App.prototype.clearMask = function(mask) {
        this.clearBits = mask;

        return this;
    };

    /**
        Set the clear color.

        @method
        @param {number} r Red channel.
        @param {number} g Green channel.
        @param {number} b Blue channel.
        @param {number} a Alpha channel.
    */
    NanoGL.App.prototype.clearColor = function(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);

        return this;
    };

    /**
        Clear the canvas

        @method
    */
    NanoGL.App.prototype.clear = function() {
        this.gl.clear(this.clearBits);

        return this;
    };

    /**
        Set the list of DrawCalls to use when calling draw().

        @method
        @param {Array} drawCallList Array of DrawCall objects.
        @see DrawCall
    */
    NanoGL.App.prototype.drawCalls = function(drawCallList) {
        this.currentDrawCalls = drawCallList;

        return this;
    };

    /**
        Bind a framebuffer to the WebGL context.

        @method
        @param {Framebuffer} framebuffer The Framebuffer object to bind.
        @see Framebuffer
    */
    NanoGL.App.prototype.framebuffer = function(framebuffer) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer.framebuffer);
        this.gl.viewport(0, 0, framebuffer.width, framebuffer.height);

        return this;
    };

    /**
        Switch back to the default framebuffer (i.e. draw to the screen).

        @method
    */
    NanoGL.App.prototype.defaultFramebuffer = function() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.width, this.height);

        return this;
    };

    /**
        Set the depth range.

        @method
        @param {number} near Minimum depth value. 
        @param {number} far Maximum depth value.
    */
    NanoGL.App.prototype.depthRange = function(near, far) {
        this.gl.depthRange(near, far);

        return this;
    };

    /**
        Enable depth testing.

        @method
    */
    NanoGL.App.prototype.depthTest = function() {
        this.gl.enable(this.gl.DEPTH_TEST);

        return this;
    };

    /**
        Disable depth testing.

        @method
    */
    NanoGL.App.prototype.noDepthTest = function() {
        this.gl.disable(this.gl.DEPTH_TEST);

        return this;
    };

    /**
        Enable writing to the z buffer.

        @method
    */
    NanoGL.App.prototype.depthMask = function() {
        this.gl.depthMask(true);

        return this;
    };

    /**
        Disable writing to the z buffer.

        @method
    */
    NanoGL.App.prototype.noDepthMask = function() {
        this.gl.depthMask(false);

        return this;
    };

    /**
        Enable blending.

        @method
    */
    NanoGL.App.prototype.blend = function() {
        this.gl.enable(this.gl.BLEND);

        return this;
    };

    /**
        Disable blending

        @method
    */
    NanoGL.App.prototype.noBlend = function() {
        this.gl.disable(this.gl.BLEND);

        return this;
    };

    /**
        Set the depth test function. E.g. app.depthFunc(NanoGL.LEQUAL).

        @method
        @param {GLEnum} func The depth testing function to use.
    */
    NanoGL.App.prototype.depthFunc = function(func) {
        this.gl.depthFunc(func);

        return this;
    };

    /**
        Set the blend function. E.g. app.blendFunc(NanoGL.ONE, NanoGL.ONE_MINUS_SRC_ALPHA).

        @method
        @param {GLEnum} src The source blending weight.
        @param {GLEnum} dest The destination blending weight.
    */
    NanoGL.App.prototype.blendFunc = function(src, dest) {
        this.gl.blendFunc(src, dest);

        return this;
    };

    /**
        Set the blend function, with separate weighting for color and alpha channels. 
        E.g. app.blendFuncSeparate(NanoGL.ONE, NanoGL.ONE_MINUS_SRC_ALPHA, NanoGL.ONE, NanoGL.ONE).

        @method
        @param {GLEnum} csrc The source blending weight for the RGB channels.
        @param {GLEnum} cdest The destination blending weight for the RGB channels.
        @param {GLEnum} asrc The source blending weight for the alpha channel.
        @param {GLEnum} adest The destination blending weight for the alpha channel.
    */
    NanoGL.App.prototype.blendFuncSeparate = function(csrc, cdest, asrc, adest) {
        this.gl.blendFuncSeparate(csrc, cdest, asrc, adest);

        return this;
    };

    /**
        Enable backface culling.

        @method
    */
    NanoGL.App.prototype.cullBackfaces = function() {
        this.gl.enable(this.gl.CULL_FACE);

        return this;
    };

    /**
        Disable backface culling.

        @method
    */
    NanoGL.App.prototype.drawBackfaces = function() {
        this.gl.disable(this.gl.CULL_FACE);

        return this;
    };

    /**
        Enable the WEBGL_draw_buffers extension. Allows multiple render targets
        to be drawn in a single draw call, which will be stored in the colorTextures
        array of a Framebuffer object.

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.drawBuffers = function() {
        this.drawBuffersExtension = this.gl.getExtension("WEBGL_draw_buffers");
        
        if (this.drawBuffersExtension) {
            this.maxDrawBuffers = this.gl.getParameter(this.drawBuffersExtension.MAX_DRAW_BUFFERS_WEBGL);
            this.drawBuffersEnabled = true;
        } else {
            console.warn("Extension WEBGL_draw_buffers unavailable. Cannot enable draw buffers.");
        }
        
        return this;
    };

    /**
        Enable the WEBGL_depth_texture extension. Allows for writing depth values
        to a texture, which will be stored in the depthTexture property of a Framebuffer
        object.

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.depthTextures = function() {
        this.depthTexturesEnabled = !!this.gl.getExtension("WEBGL_depth_texture");
        
        if (!this.depthTexturesEnabled) {
            console.warn("Extension WEBGL_depth_texture unavailable. Cannot enable depth textures.");
        }
        
        return this;
    };

    /**
        Enable the OES_texture_float extension. Allows for creating float textures as
        render targets on FrameBuffer objects. E.g. app.createFramebuffer(1, NanoGL.FLOAT).

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.floatTextures = function() {
        this.floatTexturesEnabled = !!this.gl.getExtension("OES_texture_float");
        
        if (!this.floatTexturesEnabled) {
            console.warn("Extension OES_texture_float unavailable. Cannot enable float textures.");
        }
        
        return this;
    };

    /**
        Enable the OES_texture_float_linear extension. Allows for linear blending on float textures.

        @method
        @see Framebuffer
    */
    NanoGL.App.prototype.linearFloatTextures = function() {
        this.linearFloatTexturesEnabled = !!this.gl.getExtension("OES_texture_float_linear");
        
        if (!this.linearFloatTexturesEnabled) {
            console.warn("Extension OES_texture_float_linear unavailable. Cannot enable float texture linear filtering.");
        }
        
        return this;
    };

    /**
        Read a pixel's color value from the canvas. Note that the RGBA values will be encoded 
        as 0-255.

        @method
        @param {number} x The x coordinate of the pixel.
        @param {number} y The y coordinate of the pixel.
        @param {Uint8Array} outColor 4-element Uint8Array to store the pixel's color.
    */
    NanoGL.App.prototype.readPixel = function(x, y, outColor) {
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, outColor);

        return this;
    };

    /**
        Resize the drawing surface.

        @method
        @param {number} width The new canvas width.
        @param {number} height The new canvas height.
    */
    NanoGL.App.prototype.resize = function(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        this.width = this.gl.drawingBufferWidth;
        this.height = this.gl.drawingBufferHeight;
        this.gl.viewport(0, 0, this.width, this.height);    

        return this;
    };

    /**
        Enable debug logging.

        @method
    */
    NanoGL.App.prototype.debug = function() {
        this.debugEnabled = true; 

        return this;
    };

    /**
        Create a program.

        @method
        @param {WebGLShader|string} vertexShader Vertex shader object or source code.
        @param {WebGLShader|string} fragmentShader Fragment shader object or source code.
    */
    NanoGL.App.prototype.createProgram = function(vsSource, fsSource) {
        return new NanoGL.Program(this.gl, vsSource, fsSource, this.debugEnabled);
    };

    /**
        Create a shader.

        @method
        @param {GLEnum} type Shader type.
        @param {string} source Shader source.
    */
    NanoGL.App.prototype.createShader = function(type, source) {
        var shader = this.gl.createShader(type);
        NanoGL.compileShader(this.gl, shader, source, this.debugEnabled);
        
        return shader;
    };

    /**
        Create an array buffer.

        @method
        @param {GLEnum} type The data type stored in the array buffer.
        @param {number} itemSize Number of elements per vertex.
        @param {ArrayBufferView} data Array buffer data.
    */
    NanoGL.App.prototype.createArrayBuffer = function(type, itemSize, data) {
        return new NanoGL.ArrayBuffer(this.gl, type, itemSize, data);
    };

    /**
        Create an index array buffer.

        @method
        @param {GLEnum} type The data type stored in the index array buffer.
        @param {number} itemSize Number of elements per primitive.
        @param {ArrayBufferView} data Index array buffer data.
    */
    NanoGL.App.prototype.createIndexBuffer = function(type, itemSize, data) {
        return new NanoGL.ArrayBuffer(this.gl, type, itemSize, data, true);
    };

    /**
        Create a texture.

        @method
        @param {ImageElement|ArrayBufferView} image The image data. Can be any format that would be accepted by texImage2D.
        @param {Object} [options] Texture options.
        @param {GLEnum} [options.type=UNSIGNED_BYTE] Type of data stored in the texture.
        @param {GLEnum} [options.internalFormat=RGBA] Texture data format.
        @param {boolean} [options.array=false] Whether the texture is being passed as an ArrayBufferView.
        @param {number} [options.width] Width of the texture (only valid when passing array texture data).
        @param {number} [options.height] Height of the texture (only valid when passing array texture data).
        @param {boolean} [options.flipY=true] Whether th y-axis be flipped when reading the texture.
        @param {GLEnum} [options.minFilter=LINEAR_MIPMAP_NEAREST] Minification filter.
        @param {GLEnum} [options.magFilter=LINEAR] Magnification filter.
        @param {GLEnum} [options.wrapS=REPEAT] Horizontal wrap mode.
        @param {GLEnum} [options.wrapT=REPEAT] Vertical wrap mode.
        @param {boolean} [options.generateMipmaps] Should mip maps be generated.
    */
    NanoGL.App.prototype.createTexture = function(image, options) {
        return new NanoGL.Texture(this.gl, image, options);
    };

    /**
        Create a texture.

        @method
        @param {Object} [options] Texture options.
        @param {ImageElement|ArrayBufferView} options.negX The image data for the negative X direction. Can be any format that would be accepted by texImage2D.
        @param {ImageElement|ArrayBufferView} options.posX The image data for the positive X direction. Can be any format that would be accepted by texImage2D.
        @param {ImageElement|ArrayBufferView} options.negY The image data for the negative Y direction. Can be any format that would be accepted by texImage2D.
        @param {ImageElement|ArrayBufferView} options.posY The image data for the positive Y direction. Can be any format that would be accepted by texImage2D.
        @param {ImageElement|ArrayBufferView} options.negZ The image data for the negative Z direction. Can be any format that would be accepted by texImage2D.
        @param {ImageElement|ArrayBufferView} options.posZ The image data for the positive Z direction. Can be any format that would be accepted by texImage2D.
        @param {GLEnum} [options.type=UNSIGNED_BYTE] Type of data stored in the texture.
        @param {GLEnum} [options.internalFormat=RGBA] Texture data format.
        @param {boolean} [options.array=false] Whether the texture is being passed as an ArrayBufferView.
        @param {number} [options.width] Width of the texture (only valid when passing array texture data).
        @param {number} [options.height] Height of the texture (only valid when passing array texture data).
        @param {boolean} [options.flipY=false] Whether th y-axis be flipped when reading the texture.
        @param {GLEnum} [options.minFilter=LINEAR_MIPMAP_NEAREST] Minification filter.
        @param {GLEnum} [options.magFilter=LINEAR] Magnification filter.
        @param {GLEnum} [options.wrapS=REPEAT] Horizontal wrap mode.
        @param {GLEnum} [options.wrapT=REPEAT] Vertical wrap mode.
        @param {boolean} [options.generateMipmaps] Should mip maps be generated.
    */
    NanoGL.App.prototype.createCubemap = function(options) {
        return new NanoGL.Cubemap(this.gl, options);
    };

    /**
        Create a framebuffer.

        @method
        @param {number} numColorTextures The number of color draw targets to create (requires enabled drawBuffers to be greater than 1).
        @param {GLEnum} [colorTargetType=UNSIGNED_BYTE] Type of data stored in the color targets.
        @param {number} [width=app.width] Width of the framebuffer.
        @param {number} [height=app.height] Height of the framebuffer.
    */
    NanoGL.App.prototype.createFramebuffer = function(numColorTextures, colorTargetType, width, height) {
        return new NanoGL.Framebuffer(this.gl, this.drawBuffersExtension, numColorTextures, colorTargetType, this.depthTexturesEnabled, width, height);
    };

    /**
        Create a DrawCall. A DrawCall manages the state associated with 
        a WebGL draw call including a program and associated attributes, textures and
        uniforms.

        @method
        @param {Program} program The program to use for this DrawCall.
        @param {GLEnum} [primitive=TRIANGLES] Type of primitive to draw.
    */
    NanoGL.App.prototype.createDrawCall = function(program, primitive) {
        return new NanoGL.DrawCall(this.gl, program, primitive);
    };

    /** 
        Execute the currently attached list of DrawCalls.

        @method
    */
    NanoGL.App.prototype.draw = function() {
        for (var i = 0, len = this.currentDrawCalls.length; i < len; i++) {
            this.currentDrawCalls[i].draw(this.currentState);
        }

        return this;
    };

})();
