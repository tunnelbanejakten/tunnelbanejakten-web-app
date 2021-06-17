<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">
        Home
      </router-link>
      <router-link to="/devicetest">
        Device Test
      </router-link>
      <router-link to="/about">
        About
      </router-link>
    </div>
    <router-view />
  </div>
</template>

<style>
#app {
  font-family: sans-serif;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

#nav {
  padding: 10px;
  display: flex;
  justify-content: space-evenly;
}

#nav a {
  display: block;
}

#nav a.router-link-exact-active {
}
</style>
