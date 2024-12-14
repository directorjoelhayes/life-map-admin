<template>
    <div class="expandable" :style="{ height: formatValue(height) }">
        <Transition @before-enter="onBeforeEnter" @enter="onEnter" @after-enter="onAfterEnter"
            @enter-cancelled="onEnterCancelled" @before-leave="onBeforeLeave" @leave="onLeave" :css="false">
            <slot></slot>
        </Transition>
    </div>
</template>

<script>

import { ref } from "vue"
import * as TWEEN from '@tweenjs/tween.js'

export default {
    setup() {

        const height = ref(0)

        function onBeforeEnter(el) {
            // el.style.opacity = 0;
        }

        // called one frame after the element is inserted.
        // use this to start the entering animation.
        function onEnter(el, done) {

            // call the done callback to indicate transition end
            // optional if used in combination with CSS
            const to = { height: el.getBoundingClientRect().height };
            const from = { height: 0 }

            const tween = new TWEEN.Tween(from, false) // Create a new tween that modifies 'coords'.
                .to(to, 600) // Move to (300, 200) in 1 second.
                .easing(TWEEN.Easing.Quadratic.InOut) // Use an easing function to make the animation smooth.
                .onUpdate(() => {
                    // Called after tween.js updates 'coords'.
                    // Move 'box' to the position described by 'coords' with a CSS translation.
                    // box.style.setProperty('transform', 'transleate(' + coords.x + 'px, ' + coords.y + 'px)')

                    height.value = from.height;
                })
                .start() // Start the tween immediately.
                .onComplete(() => {
                    done()
                })

            // Setup the animation loop.
            function animate(time) {
                tween.update(time)
                requestAnimationFrame(animate)
            }
            requestAnimationFrame(animate)
            


        }

        // called when the enter transition has finished.
        function onAfterEnter(el) {
            
            height.value = "auto"
            
        }

        // called when the enter transition is cancelled before completion.
        function onEnterCancelled(el) { }

        // called before the leave hook.
        // Most of the time, you should just use the leave hook
        function onBeforeLeave(el) { }

        // called when the leave transition starts.
        // use this to start the leaving animation.
        function onLeave(el, done) {
            // call the done callback to indicate transition end
            // optional if used in combination with CSS
            // call the done callback to indicate transition end
            // optional if used in combination with CSS
            const from = { height: el.getBoundingClientRect().height };
            const to = { height: 0 }

            const tween = new TWEEN.Tween(from, false) // Create a new tween that modifies 'coords'.
                .to(to, 600) // Move to (300, 200) in 1 second.
                .easing(TWEEN.Easing.Quadratic.InOut) // Use an easing function to make the animation smooth.
                .onUpdate(() => {
                    // Called after tween.js updates 'coords'.
                    // Move 'box' to the position described by 'coords' with a CSS translation.
                    // box.style.setProperty('transform', 'transleate(' + coords.x + 'px, ' + coords.y + 'px)')

                    height.value = from.height;
                })
                .start()
                .onComplete(() => {
                    
                    done()
                })
                // Start the tween immediately.

            // Setup the animation loop.
            function animate(time) {
                tween.update(time)
                requestAnimationFrame(animate)
            }
            requestAnimationFrame(animate)
            
        }

        // called when the leave transition has finished and the
        // element has been removed from the DOM.
        function onAfterLeave(el) { }

        // only available with v-show transitions
        function onLeaveCancelled(el) { }

        function formatValue(value) {
            console.log(typeof value)
            if(typeof value === "number") return value + 'px';
            else return value;
        }

        return {
            onEnter,
            onBeforeEnter,
            onBeforeLeave,
            onEnterCancelled,
            onLeave,
            onAfterEnter,
            onAfterLeave,
            onLeaveCancelled,
            height,
            formatValue
        }

    },
}
</script>

<style scoped>
.expandable {
    position: relative;
    overflow: hidden;
    height: 0px;
    width: 100%;
}
/* .exandable > div {
    transition: 
} */
</style>


