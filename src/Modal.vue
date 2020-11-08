<template>
  <transition name="modal">
    <div class="modal-mask" @keydown.27="$emit('cancel')" role="alertdialog">
      <div class="modal-wrapper">
        <div class="modal-container" :style="width ? 'width:' + width + 'px' : ''" role="dialog" aria-labelledby="modalTitle" aria-describedby="modalDescription" aria-modal="true">
          <button class="modal-cancel-button" @click="doCancel" aria-label="Close">X</button>

          <div class="modal-header" id="modalTitle">
            <slot name="header">
            Default header
            </slot>
          </div>

          <div class="modal-body" id="modalDescription" ref="modalbody" @scroll="doScroll">
            <slot></slot>
          </div>

          <div class="modal-footer">
            <button class="modal-default-button" v-focus.lazy="!nofocus" @click="doClose" @keypress.13.prevent="doClose" :aria-label="close || 'Close'">
              {{ close || 'Close' }}
            </button>
            <button v-if="cancel" class="modal-default-button" @click="doCancel" @keypress.27.prevent="doCancel" :aria-label="cancel">
              {{ cancel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mixin as focusMixin } from 'vue-focus'

export default {
  name: 'modal',
  mixins: [focusMixin],
  props: ['width', 'close', 'cancel', 'nofocus'],
  data () {
    return {
      scrollLocked: true
    }
  },
  mounted () {
    var el = this.$refs.modalbody;
    // if we are scrolled to the bottom, keep us there
    if (this.scrollLocked) {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    }
    this.scrollLocked = el.scrollTop === (el.scrollHeight - el.clientHeight);
  },
  updated () {
    var el = this.$refs.modalbody;
    // if we are scrolled to the bottom, keep us there
    if (this.scrollLocked) {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    }
    this.scrollLocked = el.scrollTop === (el.scrollHeight - el.clientHeight);
  },
  methods: {
    doScroll: function () {
      var el = this.$refs.modalbody;
      this.scrollLocked = el.scrollTop === (el.scrollHeight - el.clientHeight);
    },
    doClose: function () {
      this.scrollLocked = true;
      this.$emit('close');
    },
    doCancel: function () {
      this.scrollLocked = true;
      this.$emit('cancel');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.modal-mask {
  position: fixed;
  display: block !important;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  text-align: center;
  line-height: 100vh;
  overflow: hidden;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: inline-block;
  vertical-align: middle;
  line-height: normal;
  text-align: left;
}

.modal-container {
  width: 300px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
  max-height: calc(100vh - 180px);
  min-height: 3em;
  overflow-y: auto;
}

.modal-body textarea {
  resize: none;
}

.modal-footer {
  display: flex;
  justify-content: space-around;
}

.modal-default-button {
  margin: 0 10px;
}

.modal-cancel-button {
  float: right;
  margin: 0;
  color: white;
  font-weight: bold;
  background-color: red;
  border: none;
  padding: 2px 10px;
  margin-right: -30px;
  margin-top: -20px;
  border-radius: 0 2px 0 0;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>

