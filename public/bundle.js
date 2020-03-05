
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Cartao.svelte generated by Svelte v3.19.2 */

    const file = "src/Cartao.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let header;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t1;
    	let t2;
    	let h2;
    	let t3;
    	let t4;
    	let div2;
    	let p;
    	let t5;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text(/*nome*/ ctx[0]);
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(/*titulo*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			p = element("p");
    			t5 = text(/*descricao*/ ctx[2]);
    			if (img.src !== (img_src_value = /*imagem*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*nome*/ ctx[0]);
    			attr_dev(img, "class", "svelte-1ouuzbu");
    			add_location(img, file, 69, 6, 1089);
    			attr_dev(div0, "class", "imagem svelte-1ouuzbu");
    			toggle_class(div0, "imagem-placeholder", !/*imagem*/ ctx[3]);
    			add_location(div0, file, 68, 4, 1027);
    			attr_dev(h1, "class", "svelte-1ouuzbu");
    			add_location(h1, file, 72, 6, 1164);
    			attr_dev(h2, "class", "svelte-1ouuzbu");
    			add_location(h2, file, 73, 6, 1186);
    			attr_dev(div1, "class", "usuario svelte-1ouuzbu");
    			add_location(div1, file, 71, 4, 1136);
    			attr_dev(header, "class", "svelte-1ouuzbu");
    			add_location(header, file, 67, 2, 1014);
    			add_location(p, file, 77, 4, 1259);
    			attr_dev(div2, "class", "description svelte-1ouuzbu");
    			add_location(div2, file, 76, 2, 1229);
    			attr_dev(div3, "class", "cartao svelte-1ouuzbu");
    			add_location(div3, file, 66, 0, 991);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, header);
    			append_dev(header, div0);
    			append_dev(div0, img);
    			append_dev(header, t0);
    			append_dev(header, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imagem*/ 8 && img.src !== (img_src_value = /*imagem*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*nome*/ 1) {
    				attr_dev(img, "alt", /*nome*/ ctx[0]);
    			}

    			if (dirty & /*imagem*/ 8) {
    				toggle_class(div0, "imagem-placeholder", !/*imagem*/ ctx[3]);
    			}

    			if (dirty & /*nome*/ 1) set_data_dev(t1, /*nome*/ ctx[0]);
    			if (dirty & /*titulo*/ 2) set_data_dev(t3, /*titulo*/ ctx[1]);
    			if (dirty & /*descricao*/ 4) set_data_dev(t5, /*descricao*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { nome } = $$props;
    	let { titulo } = $$props;
    	let { descricao } = $$props;
    	let { imagem } = $$props;
    	const writable_props = ["nome", "titulo", "descricao", "imagem"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cartao> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Cartao", $$slots, []);

    	$$self.$set = $$props => {
    		if ("nome" in $$props) $$invalidate(0, nome = $$props.nome);
    		if ("titulo" in $$props) $$invalidate(1, titulo = $$props.titulo);
    		if ("descricao" in $$props) $$invalidate(2, descricao = $$props.descricao);
    		if ("imagem" in $$props) $$invalidate(3, imagem = $$props.imagem);
    	};

    	$$self.$capture_state = () => ({ nome, titulo, descricao, imagem });

    	$$self.$inject_state = $$props => {
    		if ("nome" in $$props) $$invalidate(0, nome = $$props.nome);
    		if ("titulo" in $$props) $$invalidate(1, titulo = $$props.titulo);
    		if ("descricao" in $$props) $$invalidate(2, descricao = $$props.descricao);
    		if ("imagem" in $$props) $$invalidate(3, imagem = $$props.imagem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nome, titulo, descricao, imagem];
    }

    class Cartao extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			nome: 0,
    			titulo: 1,
    			descricao: 2,
    			imagem: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cartao",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*nome*/ ctx[0] === undefined && !("nome" in props)) {
    			console.warn("<Cartao> was created without expected prop 'nome'");
    		}

    		if (/*titulo*/ ctx[1] === undefined && !("titulo" in props)) {
    			console.warn("<Cartao> was created without expected prop 'titulo'");
    		}

    		if (/*descricao*/ ctx[2] === undefined && !("descricao" in props)) {
    			console.warn("<Cartao> was created without expected prop 'descricao'");
    		}

    		if (/*imagem*/ ctx[3] === undefined && !("imagem" in props)) {
    			console.warn("<Cartao> was created without expected prop 'imagem'");
    		}
    	}

    	get nome() {
    		throw new Error("<Cartao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nome(value) {
    		throw new Error("<Cartao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get titulo() {
    		throw new Error("<Cartao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titulo(value) {
    		throw new Error("<Cartao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get descricao() {
    		throw new Error("<Cartao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set descricao(value) {
    		throw new Error("<Cartao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imagem() {
    		throw new Error("<Cartao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imagem(value) {
    		throw new Error("<Cartao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let div2;
    	let label2;
    	let t7;
    	let input2;
    	let t8;
    	let div3;
    	let label3;
    	let t10;
    	let textarea;
    	let t11;
    	let current;
    	let dispose;

    	const cartao = new Cartao({
    			props: {
    				nome: /*nome*/ ctx[0],
    				titulo: /*titulo*/ ctx[1],
    				descricao: /*descricao*/ ctx[3],
    				imagem: /*imagem*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nome";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Título";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "URL da Imagem";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Descrição";
    			t10 = space();
    			textarea = element("textarea");
    			t11 = space();
    			create_component(cartao.$$.fragment);
    			attr_dev(label0, "for", "nome");
    			add_location(label0, file$1, 18, 4, 262);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "nome");
    			add_location(input0, file$1, 19, 4, 297);
    			attr_dev(div0, "class", "form-control");
    			add_location(div0, file$1, 17, 2, 231);
    			attr_dev(label1, "for", "titulo");
    			add_location(label1, file$1, 22, 4, 389);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "titulo");
    			add_location(input1, file$1, 23, 4, 428);
    			attr_dev(div1, "class", "form-control");
    			add_location(div1, file$1, 21, 2, 358);
    			attr_dev(label2, "for", "imagem");
    			add_location(label2, file$1, 26, 4, 524);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "imagem");
    			add_location(input2, file$1, 27, 4, 570);
    			attr_dev(div2, "class", "form-control");
    			add_location(div2, file$1, 25, 2, 493);
    			attr_dev(label3, "for", "descricao");
    			add_location(label3, file$1, 30, 4, 666);
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "id", "descricao");
    			add_location(textarea, file$1, 31, 4, 711);
    			attr_dev(div3, "class", "form-control");
    			add_location(div3, file$1, 29, 2, 635);
    			attr_dev(div4, "id", "form");
    			attr_dev(div4, "class", "svelte-pd4ajg");
    			add_location(div4, file$1, 16, 0, 213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*nome*/ ctx[0]);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*titulo*/ ctx[1]);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t7);
    			append_dev(div2, input2);
    			set_input_value(input2, /*imagem*/ ctx[2]);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t10);
    			append_dev(div3, textarea);
    			set_input_value(textarea, /*descricao*/ ctx[3]);
    			insert_dev(target, t11, anchor);
    			mount_component(cartao, target, anchor);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[7])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nome*/ 1 && input0.value !== /*nome*/ ctx[0]) {
    				set_input_value(input0, /*nome*/ ctx[0]);
    			}

    			if (dirty & /*titulo*/ 2 && input1.value !== /*titulo*/ ctx[1]) {
    				set_input_value(input1, /*titulo*/ ctx[1]);
    			}

    			if (dirty & /*imagem*/ 4 && input2.value !== /*imagem*/ ctx[2]) {
    				set_input_value(input2, /*imagem*/ ctx[2]);
    			}

    			if (dirty & /*descricao*/ 8) {
    				set_input_value(textarea, /*descricao*/ ctx[3]);
    			}

    			const cartao_changes = {};
    			if (dirty & /*nome*/ 1) cartao_changes.nome = /*nome*/ ctx[0];
    			if (dirty & /*titulo*/ 2) cartao_changes.titulo = /*titulo*/ ctx[1];
    			if (dirty & /*descricao*/ 8) cartao_changes.descricao = /*descricao*/ ctx[3];
    			if (dirty & /*imagem*/ 4) cartao_changes.imagem = /*imagem*/ ctx[2];
    			cartao.$set(cartao_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cartao.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cartao.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t11);
    			destroy_component(cartao, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let nome = "Luiz";
    	let titulo = "";
    	let imagem = "";
    	let descricao = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input0_input_handler() {
    		nome = this.value;
    		$$invalidate(0, nome);
    	}

    	function input1_input_handler() {
    		titulo = this.value;
    		$$invalidate(1, titulo);
    	}

    	function input2_input_handler() {
    		imagem = this.value;
    		$$invalidate(2, imagem);
    	}

    	function textarea_input_handler() {
    		descricao = this.value;
    		$$invalidate(3, descricao);
    	}

    	$$self.$capture_state = () => ({ Cartao, nome, titulo, imagem, descricao });

    	$$self.$inject_state = $$props => {
    		if ("nome" in $$props) $$invalidate(0, nome = $$props.nome);
    		if ("titulo" in $$props) $$invalidate(1, titulo = $$props.titulo);
    		if ("imagem" in $$props) $$invalidate(2, imagem = $$props.imagem);
    		if ("descricao" in $$props) $$invalidate(3, descricao = $$props.descricao);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		nome,
    		titulo,
    		imagem,
    		descricao,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		textarea_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
