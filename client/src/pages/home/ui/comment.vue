<template>
  <v-card-text class="pb-0">
    <div class="d-flex ga-2 align-center">
      <div class="align-self-center">John Doe</div>
      <v-rating
        :length="5"
        :model-value="3"
        size="sm"
        color="yellow"
        readonly
      />
    </div>
    <p>
      Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sequi eius
      debitis autem expedita, dolores distinctio voluptatem accusantium sint.
      Temporibus aliquid totam sequi porro dolores. Ad beatae quasi quas?
      Consectetur, distinctio.
    </p>
    <v-divider />
  </v-card-text>
</template>
