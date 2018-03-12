import React from 'react'
import Helmet from 'react-helmet'
import "./style.scss";

class Layout extends React.Component {
    render(){
        const {children} = this.props;

        return (
            <div className="layout">
                <Helmet defaultTitle="Blog by LiuYang"/>
                {children()}
            </div>
        );
    }
}

export default Layout;