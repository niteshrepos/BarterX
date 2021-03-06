/**
 * Module dependencies.
 */


var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  , fs = require('fs')


  /**
   * Load
   */

  exports.load = function(req, res, next, id) {
    var User = mongoose.model('User')

    Article.load(id, function(err, article) {
      if (err) return next(err)
      if (!article) return next(new Error('not found'))
      req.article = article
      next()
    })
  }

  /**
   * List
   */

  exports.dashboard = function(req, res) {
    var renderObject = {};

    Article.find({
      'user': req.user._id
    }, function(err, articles) {

      // console.log
      if (err) return res.render('500')
      Article.count().exec(function(err, count) {
        Article.find({'user': {'$ne': req.user._id}}, function(err, allArticles) {
          Article.count().exec(function(err, count) {
            res.render("dashboard", {
              articles: articles,
              recommendedArticles: allArticles
            });
          })
        })
        // res.render('articles/index', {
        //   title: 'Articles',
        //   articles: articles,
        //   page: page + 1,
        //   pages: Math.ceil(count / perPage)
        // })

      })
    })

  }

exports.wishFor = function(req, res) {
  console.log("wish", req.body.wishFor);
  Article.load(req.body.wishFor, function(err, article) {
    var art = article;
    // if (err) return next(err)
    // if (!article) return next(new Error('not found'))
    console.log("reqart",req.article._id);

    // console.log(err)
    art.wishFor.push(req.article._id);
    console.log("art ",article);
    art.save();
    res.redirect("/dashboard");
  })
}

exports.accepted = function(req, res) {
  Article.load(req.body.wishFor, function(err, article) {
    // if (err) return next(err)
    // if (!article) return next(new Error('not found'))
    article.accepted = req.article._id;
    article.save();
    req.article.accepted = article._id;
    req.article.save();
    res.redirect("/dashboard");
  })
}

exports.index = function(req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30
  var options = {
    perPage: perPage,
    page: page
  }

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count().exec(function(err, count) {
      res.render('articles/index', {
        title: 'Articles',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

/**
 * New article
 */

exports.new = function(req, res) {
  res.render('articles/new', {
    title: 'New Article',
    article: new Article({})
  })
}

/**
 * Create an article
 */

exports.create = function(req, res) {
  var article = new Article(req.body)
  article.user = req.user;
  console.log('req.files.image[0].path ', req.files.image[0].path)
  fs.readFile(req.files.image[0].path, function(err, data) {
    var newPath = __dirname + "/../../public/img/" + req.files.image[0].originalFilename;
    fs.writeFile(newPath, data, function(err) {
      console.error(err);
    });
  });

  article.uploadAndSave(req.files.image, function(err) {
    if (!err) {
      req.flash('success', 'Successfully created article!')
      return res.redirect('/dashboard')
    }

    res.render('articles/new', {
      title: 'New Article',
      article: article,
      errors: utils.errors(err.errors || err)
    })
  })
}

/**
 * Edit an article
 */

exports.edit = function(req, res) {
  res.render('articles/edit', {
    title: 'Edit ' + req.article.title,
    article: req.article
  })
}

/**
 * Update article
 */

exports.update = function(req, res) {
  var article = req.article
  article = _.extend(article, req.body)

  article.uploadAndSave(req.files.image, function(err) {
    if (!err) {
      return res.redirect('/articles/' + article._id)
    }

    res.render('articles/edit', {
      title: 'Edit Article',
      article: article,
      errors: err.errors
    })
  })
}

/**
 * Show
 */

exports.show = function(req, res) {
  res.render('articles/show', {
    title: req.article.title,
    article: req.article
  })
}

/**
 * Delete an article
 */

exports.destroy = function(req, res) {
  var article = req.article
  article.remove(function(err) {
    req.flash('info', 'Deleted successfully')
    res.redirect('/articles')
  })
}
