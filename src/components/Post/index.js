import React from 'react';
import Link from 'gatsby-link';
import moment from 'moment';
import './style.scss';

class Post extends React.Component {
    constructor(props){
        super(props);

    }

    render(){
        const { excerpt } = this.props.data;
        const { title, date, category} = this.props.data.frontmatter;
        const { slug, categorySlug } = this.props.data.fields;

        return (
            <div className="post">
                <div className="post__meta">
                    <span className="post__meta-time">{moment(date).format('YYYY-MM-DD')}</span>
                    <span className="post__meta-divider"/>
                    <span className="post__meta-category">
                        <Link className="post__meta-category-link" to={categorySlug}>
                            {category}
                        </Link>
                    </span>
                </div>
                <h2 className="post__title">
                    <Link className="post__title-link" to={slug}>{title}</Link>
                </h2>
                <p className="post__description">{excerpt}</p>
                <Link className="post__readmore" to={slug}>Read</Link>
            </div>
        );
    }
}

export default Post;