import type { ImageSource } from 'expo-image';
export const images:Record<string,ImageSource>={
 climbing:require('../../assets/images/climbing.jpg'),basketball:require('../../assets/images/basketball.jpg'),stadium:require('../../assets/images/stadium.jpg'),
 food:require('../../assets/images/food.jpg'),picnic:require('../../assets/images/picnic.jpg'),bowling:require('../../assets/images/bowling.jpg'),concert:require('../../assets/images/concert.jpg'),
 orchard:require('../../assets/images/orchard.jpg'),city:require('../../assets/images/city.jpg'),friends:require('../../assets/images/friends.jpg'),gym:require('../../assets/images/gym.jpg'),
 coffee:require('../../assets/images/coffee.jpg'),movie:require('../../assets/images/movie.jpg'),ceramics:require('../../assets/images/ceramics.jpg'),study:require('../../assets/images/study.jpg'),
 shawn:require('../../assets/images/shawn.jpg'),maya:require('../../assets/images/maya.jpg'),alex:require('../../assets/images/alex.jpg'),ryan:require('../../assets/images/ryan.jpg'),noah:require('../../assets/images/noah.jpg'),
 thrift:require('../../assets/images/city.jpg'),games:require('../../assets/images/bowling.jpg'),volleyball:require('../../assets/images/basketball.jpg'),hammock:require('../../assets/images/picnic.jpg'),walk:require('../../assets/images/picnic.jpg'),
};
export function imageSource(key:string):ImageSource{return images[key]??(key.startsWith('file:')||key.startsWith('blob:')||key.startsWith('data:')||key.startsWith('http')?{uri:key}:images.picnic);}
