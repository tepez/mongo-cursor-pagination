const mongoose = require('mongoose');
const _ = require('underscore');

const dbUtils = require('./support/db');
const mongooseCursorPaginate = require('../src/mongoose.plugin');

const AuthorSchema = new mongoose.Schema(
  {
    name: String,
  },
  {
    autoIndex: false,
  }
);
AuthorSchema.index(
  {
    name: 'text',
  },
  {
    background: false,
  }
);

AuthorSchema.plugin(mongooseCursorPaginate, { name: 'paginateFN', searchFnName: 'searchFN' });

const PostSchema = new mongoose.Schema(
  {
    title: String,
    date: Date,
    body: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'Author',
    },
  },
  { autoIndex: false }
);

PostSchema.plugin(mongooseCursorPaginate);
PostSchema.index(
  {
    title: 'text',
  },
  {
    background: false,
  }
);

describe('mongoose plugin', () => {
  let mongod;
  let connection;
  let Author;
  let Post;

  beforeAll(async () => {
    mongod = await dbUtils.start();
    connection = await mongoose
      .createConnection(mongod.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .asPromise();
    await connection.db.dropDatabase();

    Author = connection.model('Author', AuthorSchema);
    Post = connection.model('Post', PostSchema);

    const author = await Author.create({ name: 'Pawan Pandey' });

    const posts = [],
      date = new Date();

    for (let i = 1; i <= 100; i++) {
      const post = new Post({
        title: 'Post #' + i,
        date: new Date(date.getTime() + i),
        author: author._id,
        body: 'Post Body #' + i,
      });
      posts.push(post);
    }

    await Post.create(posts);
    await Author.createIndexes();
    await Post.createIndexes();
  });

  afterAll(async () => {
    await connection.close();
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('initializes the pagination function by the provided name', async () => {
    const promise = Author.paginateFN();
    expect(promise.then instanceof Function).toBe(true);
    await promise;
  });

  it('returns a promise', async () => {
    const promise = Post.paginate();
    expect(promise.then instanceof Function).toBe(true);
    await promise;
  });

  it('returns data in the expected format', async () => {
    const data1 = await Post.paginate();
    expect(data1).toEqual({
      hasNext: true,
      hasPrevious: false,
      next: expect.any(String),
      previous: expect.any(String),
      results: _.times(50, () => expect.any(mongoose.Document)),
    });
    expect(data1.results[0].toObject()).toEqual(
      expect.objectContaining({
        title: 'Post #100',
      })
    );
    expect(data1.results[49].toObject()).toEqual(
      expect.objectContaining({
        title: 'Post #51',
      })
    );

    const data2 = await Post.paginate({
      next: data1.next,
    });
    expect(data2).toEqual({
      hasNext: false,
      hasPrevious: true,
      next: expect.any(String),
      previous: expect.any(String),
      results: _.times(50, () => expect.any(mongoose.Document)),
    });
    expect(data2.results[0].toObject()).toEqual(
      expect.objectContaining({
        title: 'Post #50',
      })
    );
    expect(data2.results[49].toObject()).toEqual(
      expect.objectContaining({
        title: 'Post #1',
      })
    );
  });

  //#region search
  it('initializes the search function by the provided name', async () => {
    const promise = Author.searchFN('');
    expect(promise.then instanceof Function).toBe(true);
    await promise;
  });

  it('returns a promise for search function', async () => {
    const promise = Post.search('');
    expect(promise.then instanceof Function).toBe(true);
    await promise;
  });

  it('returns data in the expected format for search function', async () => {
    const allPosts = await Post.find().sort('_id');

    const data1 = await Post.search('Post #10', { limit: 3 });

    expect(data1).toEqual({
      results: [
        {
          _id: allPosts[9]._id,
          score: 1.5,
        },
        {
          _id: allPosts[99]._id,
          score: 0.75,
        },
        {
          _id: allPosts[98]._id,
          score: 0.75,
        },
      ],
      next: expect.any(String),
    });

    const data2 = await Post.search('Post #10', { limit: 3, next: data1.next });

    expect(data2).toEqual({
      results: [
        {
          _id: allPosts[97]._id,
          score: 0.75,
        },
        {
          _id: allPosts[96]._id,
          score: 0.75,
        },
        {
          _id: allPosts[95]._id,
          score: 0.75,
        },
      ],
      next: expect.any(String),
    });
  });
  //#endregion
});
